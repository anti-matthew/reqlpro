'use strict';

import r from 'rethinkdb';
import co from 'co';
import uuid from 'node-uuid';

const RethinkDbService = function() {

};

/**
 * Generate a RethinkDB client connection
 * @returns {Promise}
 */
RethinkDbService.prototype.getConnection = function(connection) {
  let ssl;
  if (connection.ca) {
    ssl = {
      ca: connection.ca || void 0,
      rejectUnauthorized: connection.rejectUnauthorized || void 0
    };
  }
  const connectionInfo = {
    host: connection.host || process.env.DATABASE_HOST,
    port: connection.port || process.env.DATABASE_HOST,
    authKey: connection.authkey || process.env.DATABASE_KEY,
    user: connection.user || void 0,
    password: connection.pass || void 0,
    ssl: ssl
  };
  return new Promise(function(resolve, reject) {
    r.connect(connectionInfo).then(function(conn) {
      conn.on('close', function() {
        console.warn('------------------------------------------------------'); // eslint-disable-line no-console
        console.warn('*********** closed a database connection *************');
        console.warn('------------------------------------------------------'); // eslint-disable-line no-console
      });
      resolve(conn);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Generate a RethinkDB database connection
 * @returns {Promise}
 */
RethinkDbService.prototype.getDatabaseConnection = function() {
  const connectionInfo = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    authKey: process.env.DATABASE_KEY,
    db: process.env.DATABASE_NAME
  };
  return new Promise(function(resolve, reject) {
    r.connect(connectionInfo).then(function(conn) {
      // console.log('opening a database connection');
      // conn.on('close', function() {
      //  console.log('closed a database connection');
      // });
      resolve(conn);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Generate a RethinkDB authkey
 * @returns {Promise}
 */
RethinkDbService.prototype.generateAuthKey = function() {
  const connectionInfo = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT
  };
  const authKey = uuid.v4();
  return new Promise(function(resolve, reject) {
    r.connect(connectionInfo).then(function(conn) {
      r.db('rethinkdb').table('cluster_config').get('auth').update({
        auth_key: authKey
      }).run(conn, function(err, results) {
        if (err) {
          reject(err);
        } else {
          conn.close();
          resolve(true);
        }
      });
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Generate a RethinkDB authkey
 * @returns {Promise}
 */
RethinkDbService.prototype.resetAuthKey = function() {
  const connectionInfo = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    authKey: process.env.DATABASE_KEY
  };
  return new Promise(function(resolve, reject) {
    r.connect(connectionInfo).then(function(conn) {
      r.db('rethinkdb').table('cluster_config').get('auth').update({
        auth_key: null
      }).run(conn, function(err, results) {
        if (err) {
          reject(err);
        } else {
          conn.close();
          resolve(true);
        }
      });
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Create a RethinkDB Database
 * @param {Object} RethinkDb Connection
 * @param {String} Database Name
 * @returns {Promise}
 */
RethinkDbService.prototype.createDb = function(conn, newDatabase) {
  return new Promise(function(resolve, reject) {
    r.dbList().run(conn, function(err, results) {
      if (err) {
        reject(err);
      } else {
        if (results.indexOf(newDatabase) === -1) {
          // Lets create the new db
          r.dbCreate(newDatabase).run(conn, function(err, results) {
            if (err) {
              reject(err);
            } else {
              resolve(newDatabase + ' was successfully created.');
            }
          });
        } else {
          resolve(newDatabase + ' already exists.');
        }
      }
    });
  });
};

/**
 * Delete a RethinkDB Database
 * @param {Object} RethinkDb Connection
 * @param {String} Database Name
 * @returns {Promise}
 */
RethinkDbService.prototype.deleteDb = function(conn, dbName) {
  return new Promise(function(resolve, reject) {
    r.dbDrop(dbName).run(conn, function(err, results) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Delete a RethinkDB Table
 * @param {Object} RethinkDb Connection
 * @param {String} Database Name
 * @param {String} Table Name
 * @returns {Promise}
 */
RethinkDbService.prototype.deleteTable = function(conn, dbName, tableName) {
  return new Promise(function(resolve, reject) {
    r.db(dbName).tableDrop(tableName).run(conn, function(err, results) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Create a RethinkDB Table
 * @param {Object} RethinkDb Connection
 * @param {String} Database Name
 * @param {String} Table Name
 * @returns {Promise}
 */
RethinkDbService.prototype.createTable = function(conn, database, newTable, primaryKey) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const result = yield r.db(database).tableCreate(newTable, {
        primaryKey: primaryKey
      }).run(conn);
      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Create a RethinkDB Index
 * @param {Object} RethinkDb Connection
 * @param {String} Table Name
 * @param {String} Index Name
 * @returns {Promise}
 */
RethinkDbService.prototype.createIndex = function(conn, database, table, newIndex) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      // Get a list of indices on a table
      const indexList = yield r.db(database).table(table).indexList().run(conn);
      // If index does not exist in indexList array then create the index
      if (indexList.indexOf(newIndex) === -1) {
        yield r.db(database).table(table).indexCreate(newIndex).run(conn);
        resolve(newIndex + ' index on table ' + table + ' was created successfully.');
      } else {
        resolve(newIndex + ' index on table ' + table + ' already existed.');
      }

    }).catch(function(err) {
      reject('Failed creating the index: ' + newIndex + ' on the table: ' + table);
    });
  });
};

/**
 * Get a list of databases
 * @param {Object} RethinkDb Connection
 * @returns {Promise}
 */
RethinkDbService.prototype.getDbList = function(conn) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const dbList = yield r.dbList().run(conn);
      resolve(dbList);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Get a list of tables for a database
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @returns {Promise}
 */
RethinkDbService.prototype.getTableList = function(conn, db) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const tableList = yield r.db(db).tableList().run(conn);
      resolve(tableList);
    }).catch(function(err) {
      reject(err);
    });
  });
};

let feed;
/**
 * Get table data
 * @param {Object} conn RethinkDb Connection
 * @param {String} db Database name
 * @param {String} table Table name
 * @param {Object} query Query Object
 * @param {Function} onUpdate function for autoRefresh
 * @returns {Promise}
 */
RethinkDbService.prototype.getTableData = function(conn, db, table, query, onUpdate) {
  return new Promise(function(resolve, reject) {
    co(function*() {

      if (query.page < 1) {
        throw new Error('page cannot be less than 1');
      }

      let filter = query.filterPredicate;
      if (!filter) {
        filter = true;
      }

      const minval = ((query.page - 1) * query.limit);
      const maxval = query.page * query.limit;
      let result;
      // If no orderBy query is given, skip the orderBy statement for big performance gains
      if (query.orderByPredicate && query.orderByPredicate.length && query.orderByPredicate[0]) {
        result = yield r.db(db).table(table).filter(filter).orderBy(...query.orderByPredicate).slice(minval, maxval).run(conn, { profile: true });
      } else {
        const res = yield r.db(db).table(table).filter(filter).slice(minval, maxval).run(conn, { profile: true });
        const value = yield res.value.toArray();
        result = Object.assign(res, { value });
      }

      if (feed) {
        yield feed.close();
      }
      if (onUpdate) {
        feed = yield r.db(db).table(table).filter(filter).changes().run(conn);
        feed.on('data', changes => {
          console.log('changes', changes); // eslint-disable-line no-console
          onUpdate();
        });
      }

      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Get table data
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @param {String} Table name
 * @param {String} Index name
 * @param {String} Index value to start from for pagination
 * @returns {Promise}
 */
RethinkDbService.prototype.getTableDataBetween = function(conn, db, table, index, start, end) {
  return new Promise(function(resolve, reject) {
    co(function*() {

      let tableData;
      if (start) {
        tableData = yield r.db(db).table(table).between(start, r.maxval, {
          leftBound: "open",
          index: index
        })
          .orderBy({
            index: index
          }).limit(5).run(conn);
      } else if (end) {
        // TODO: This doesn't work, as it start over from "zero" position
        tableData = yield r.db(db).table(table).between(r.minval, end, {
          rightBound: "open",
          index: index
        })
          .orderBy({
            index: r.desc(index)
          }).limit(5).run(conn);
      } else {
        tableData = yield r.db(db).table(table).orderBy({
          index: index || 'id'
        }).limit(5).run(conn);
      }
      resolve(tableData);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Get table size
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @param {String} Table name
 * @returns {Promise}
 */
RethinkDbService.prototype.getTableSize = function(conn, db, table, filter) {
  return new Promise(function(resolve, reject) {
    co(function*() {

      if (!filter) {
        filter = true;
      }

      const tableSize = yield r.db(db).table(table).filter(filter).count().run(conn);
      resolve(tableSize);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Insert record into table
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @param {String} Table name
 * @param {String} Record
 * @returns {Promise}
 */
RethinkDbService.prototype.insert = function(conn, db, table, record) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const result = yield r.db(db).table(table).insert(record).run(conn, { profile: true });
      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Update record in table
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @param {String} Table name
 * @param {String} Record
 * @returns {Promise}
 */
RethinkDbService.prototype.update = function(conn, db, table, record) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const config = yield r.db(db).table(table).config().run(conn);
      const result = yield r.db(db).table(table).get(record[config.primary_key]).update(record).run(conn, { profile: true });
      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Replace record in table
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @param {String} Table name
 * @param {String} Record
 * @returns {Promise}
 */
RethinkDbService.prototype.replace = function(conn, db, table, record) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const config = yield r.db(db).table(table).config().run(conn);
      const result = yield r.db(db).table(table).get(record[config.primary_key]).replace(record).run(conn, { profile: true });
      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

/**
 * Delete record in table
 * @param {Object} RethinkDb Connection
 * @param {String} Database name
 * @param {String} Table name
 * @param {String} Record
 * @returns {Promise}
 */
RethinkDbService.prototype.delete = function(conn, db, table, record) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      const config = yield r.db(db).table(table).config().run(conn);
      const result = yield r.db(db).table(table).get(record[config.primary_key]).delete().run(conn, { profile: true });
      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

module.exports = new RethinkDbService();
