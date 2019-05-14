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
      var url = this.url + '/version';
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
    key: 'get_timeseries',
    value: function get_timeseries(target) {
      var backend_request = {
        withCredentials: this.withCredentials,
        headers: this.headers,
        url: this.url + '/measurements/timeseries',
        method: 'POST',
        data: {
          mp: target.mp,
          task: target.task
        }
      };

      console.log('target: ' + JSON.stringify(target));
      console.log('query request: ' + JSON.stringify(backend_request));

      return this.backendSrv.datasourceRequest(backend_request).then(function (r) {
        if (r.status != 200) {
          console.log('error, got status: ' + r.status);
          return 'bad request';
        }
        return {
          target: target.refId,
          datapoints: _lodash2.default.map(r.data, function (p) {
            return [p[0], 1000 * p[1]];
          })
        };
      });
    }
  }, {
    key: 'query',
    value: function query(options) {
      var _this = this;

      console.log('query(options): ' + JSON.stringify(options));

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

      var target_promises = _lodash2.default.map(targets, function (t) {
        return _this.get_timeseries(t);
      });

      return Promise.all(target_promises).then(function (r) {
        return {
          _request: {
            range: options.range,
            interval: options.interval,
            maxDataPoints: options.maxDataPoints
          },
          data: r
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
