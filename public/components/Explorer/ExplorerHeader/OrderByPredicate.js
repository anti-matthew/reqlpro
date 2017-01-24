import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { refreshExplorerBody } from '../../../actions';
const shell = window.nodeRequire('electron').shell;

class OrderByPredicate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: '107px'
    };
  }

  setWidth(val) {
    const width = ((val.length * 7.24) + 77) + 'px';
    this.setState({ width });
  }

  componentWillReceiveProps(props) {
    if (props.table.query.orderByPredicate) {
      this.setWidth(props.table.query.orderByPredicate);

    }
  }

  onChange = (e) => {
    this.setWidth(e.target.value);

    this.props.setOrderByPredicate(e.target.value);
  };

  onSubmit = (e) => {
    e.preventDefault();
    this.props.submit(this.orderByInput.value);
  };

  helpClick() {
    shell.openExternal('https://www.rethinkdb.com/api/javascript/order_by/');
  }

  render() {
    const { table } = this.props;
    return (
      <div className="order-by-predicate" style={{ width: this.state.width }}>
        <form onSubmit={this.onSubmit}>
          <span className="predicate-opener">.orderBy(</span>
          <input className="form-control input-code" type="text"
                 value={table.query.orderByPredicate}
                 onChange={this.onChange}
                 ref={input => this.orderByInput = input}
          />
          <span className="predicate-closer">)</span>
        </form>
        <span className="filter-help-icon">
          <i className="fa fa-info-circle clickable" onClick={this.helpClick}/>
        </span>
      </div>
    )
  }
}

OrderByPredicate.propTypes = {
  table: PropTypes.object
};


const mapStateToProps = (state) => {
  return {
    table: state.main.selectedTable
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setOrderByPredicate: (orderByPredicate) => {
      dispatch({
        type: "SET_ORDER_BY_PREDICATE",
        orderByPredicate
      });
    },
    submit: () => {
      dispatch(refreshExplorerBody());
      // Segment.track({
      //   event: 'explorer.setOrderByPredicate',
      //   properties: {}
      // });
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrderByPredicate);