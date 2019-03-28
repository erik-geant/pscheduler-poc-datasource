'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GenericDatasource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GenericDatasource = exports.GenericDatasource = function () {
  function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
    _classCallCheck(this, GenericDatasource);

    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  _createClass(GenericDatasource, [{
    key: 'testDatasource',
    value: function testDatasource() {
      var url = this.url + '/json-proxy/connection-test';
      var backend_request = {
        withCredentials: this.withCredentials,
        headers: this.headers,
        url: url,
        method: 'GET'
      };
      console.log('testDatasource: ' + JSON.stringify(backend_request));

      return this.backendSrv.datasourceRequest(backend_request).then(function (r) {
        if (r.status === 200) {
          return {
            status: "success",
            message: "Data source is working",
            title: "Success"
          };
        }
      });
    }
  }, {
    key: 'make_latency_test_params',
    value: function make_latency_test_params(target) {
      return {
        'schema': 1,
        'schedule': { 'slip': 'PT5M' },
        'test': {
          'spec': target.test_spec,
          'type': target.test_type
        }
      };
    }
  }, {
    key: 'delay',
    value: function delay(t) {
      return new Promise(function (res, rej) {
        setTimeout(function () {
          res();
        }, t);
      });
    }
  }, {
    key: 'loop_until_finished',
    value: function loop_until_finished(status_url, ds) {

      console.log('getting status from ' + status_url);

      var backend_request = {
        withCredentials: ds.withCredentials,
        headers: ds.headers,
        url: ds.url + '/json-proxy/get',
        method: 'POST',
        data: { url: status_url + '/runs/first' }
      };

      return ds.delay(5000).then(function () {
        return ds.backendSrv.datasourceRequest(backend_request).then(function (r) {
          if (r.status !== 200) {
            return 'bad status: ' + r.status;
          }

          console.log('got task state: ' + r.data.state);
          if (!_lodash2.default.includes(['pending', 'on-deck', 'running', 'finished'], r.data.state)) {
            console.log('unusual task state');
            return 'unhandled task state';
          }

          if (r.data.state != 'finished') {
            return ds.loop_until_finished(status_url, ds);
          }

          if (r.data.hasOwnProperty('result')) {
            console.log('response has "result"');
            return r.data.result;
          }

          if (r.data.hasOwnProperty('result-merged')) {
            consoled.log('response has "result-merged"');
            return r.data['result-merged'];
          }

          console.log("can't find result key in response: " + JSON.stringify(r.data));
          return "can't find result key in response";
        });
      });
    }
  }, {
    key: 'get_measurement_result',
    value: function get_measurement_result(mp_hostname, task_data) {
      var _this = this;

      var payload = {
        url: 'https://' + mp_hostname + '/pscheduler/tasks',
        parameters: task_data
      };

      console.log('get_measurement_results: ' + JSON.stringify(task_data));

      var backend_request = {
        withCredentials: this.withCredentials,
        headers: this.headers,
        url: this.url + '/json-proxy/post',
        method: 'POST',
        data: payload
      };

      return this.backendSrv.datasourceRequest(backend_request).then(function (r) {
        if (r.status === 200) {
          return _this.loop_until_finished(r.data, _this);
        } else {
          console.log('error, got status: ' + r.status);
          return 'bad request';
        }
      });
    }
  }, {
    key: '_owpingts2epoch',
    value: function _owpingts2epoch(owpts) {
      // cf. owamp/arithm64.c, OWPNum64ToTimespec
      var OWPJAN_1970 = 0x83aa7e80;
      //    var epoch_seconds = (owpts >> 32) - OWPJAN_1970;
      var upper_32 = owpts / Math.pow(2, 32);
      var epoch_seconds = upper_32 - OWPJAN_1970;
      epoch_seconds -= OWPJAN_1970;
      //    var nsec = ((owpts & 0xffffffff) * 1000000000) >> 32;
      var lower_32 = owpts - upper_32;
      var nsec = (owpts - lower_32) * 1000000000 / Math.pow(2, 32);
      var msec = Math.floor(nsec / 1000000);
      var epoch_ts_with_ms = epoch_seconds + msec / 1000.0;
      return epoch_ts_with_ms;
    }
  }, {
    key: 'owpingts2epoch_ms',
    value: function owpingts2epoch_ms(owpts) {
      var OWPJAN_1970 = 0x83aa7e80;
      var upper_32 = owpts / Math.pow(2, 32);
      var epoch_seconds = upper_32 - OWPJAN_1970;
      return epoch_seconds * 1000;
    }
  }, {
    key: 'make_latency_table',
    value: function make_latency_table(response) {
      var _this2 = this;

      var columns = [{ text: 'src-ts', type: 'time' }, { text: 'dst-ts', type: 'time' }, { text: 'delta', type: 'number' }];

      var rows = _lodash2.default.map(response['raw-packets'], function (p) {
        var src_ts = _this2.owpingts2epoch_ms(p['src-ts']);
        var dst_ts = _this2.owpingts2epoch_ms(p['dst-ts']);
        return [src_ts, dst_ts,
        // TODO: don't understand something here ...
        Math.abs(dst_ts - src_ts)];
      });

      return {
        columns: columns,
        rows: rows,
        type: 'table'
      };
    }
  }, {
    key: 'make_latency_timeseries',
    value: function make_latency_timeseries(response) {
      var _this3 = this;

      return _lodash2.default.map(response['raw-packets'], function (p) {
        var src_ts = _this3.owpingts2epoch_ms(p['src-ts']);
        var dst_ts = _this3.owpingts2epoch_ms(p['dst-ts']);
        return [Math.abs(dst_ts - src_ts), src_ts];
      });
    }
  }, {
    key: 'make_throughput_table',
    value: function make_throughput_table(response) {
      var columns = [{ text: 'start', type: 'number' }, { text: 'end', type: 'end' }, { text: 'retransmits', type: 'integer' }, { text: 'bytes', type: 'integer' }];

      var rows = _lodash2.default.map(response['intervals'], function (p) {
        return [p.summary.start, p.summary.end, p.summary.retransmits, p.summary['throughput-bytes']];
      });

      return {
        columns: columns,
        rows: rows,
        type: 'table'
      };
    }
  }, {
    key: 'make_throughput_timeseries',
    value: function make_throughput_timeseries(response) {
      var times = _lodash2.default.map(response.intervals, function (p) {
        return p.summary.end;
      });
      var max_ts = _lodash2.default.max(times);
      var now = new Date().getTime();
      return _lodash2.default.map(response.intervals, function (p) {
        return [p.summary['throughput-bytes'], now - (p.summary.end - max_ts) * 1000];
      });
    }
  }, {
    key: 'query',
    value: function query(options) {

      //console.log('query(options): ' + JSON.stringify(options));

      var targets = options.targets.filter(function (t) {
        return !t.hide;
      });

      if (targets === undefined || targets.length == 0) {
        return new Promise(function (res, rej) {
          return res({
            _request: { data: test_parameters },
            data: []
          });
        });
      }

      // just use the first target, as an experiement (for now only)

      var target = targets[0];
      var test_parameters = this.make_latency_test_params(target);
      var ds = this;

      var result_promise = this.get_measurement_result(target.source, test_parameters);

      return result_promise.then(function (r) {

        var data = null;

        //console.log('target: ' + JSON.stringify(target));
        //console.log('ds: ' + JSON.stringify(ds));
        //console.log('result: ' + JSON.stringify(r));

        if (target.test_type == 'latency') {
          if (target.panel_type == 'table') {
            data = ds.make_latency_table(r);
          } else {
            data = {
              target: target.refId,
              datapoints: ds.make_latency_timeseries(r)
            };
          }
        }

        if (target.test_type == 'throughput') {
          if (target.panel_type == 'table') {
            data = ds.make_throughput_table(r);
          } else {
            data = {
              target: target.refId,
              datapoints: ds.make_throughput_timeseries(r)
            };
          }
        }

        console.log('data: ' + JSON.stringify(data));

        return {
          _request: test_parameters,
          data: [data]
        };
      });
    }
  }, {
    key: 'annotationQuery',
    value: function annotationQuery(options) {
      return [];
    }
  }, {
    key: 'metricFindQuery',
    value: function metricFindQuery(query) {
      console.log('metricFindQuery: IS THIS METHOD EVER CALLED?');
      /*
          return Promise.resolve(
              [
                  {text: 'm1', value: 'v1'},
                  {text: 'm2', value: 'v2'}
              ]);
      */

      return [{ text: 'm1', value: 'v1' }, { text: 'm2', value: 'v2' }];
    }
  }, {
    key: 'getTagKeys',
    value: function getTagKeys(options) {
      return [];
    }
  }, {
    key: 'getTagValues',
    value: function getTagValues(options) {
      return [];
    }
  }]);

  return GenericDatasource;
}();
//# sourceMappingURL=datasource.js.map
