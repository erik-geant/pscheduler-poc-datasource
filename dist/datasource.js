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
        key: 'query',
        value: function query(options) {

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

            var test_parameters = this.make_latency_test_params(targets[0]);

            var result_promise = this.get_measurement_result(targets[0].source, test_parameters);

            return result_promise.then(function (r) {

                var columns = [];
                var rows = [];

                if (test_parameters.test.type == 'latency') {
                    columns = [{ text: 'src-ts', type: 'integer' }, { text: 'dst-ts', type: 'integer' }, { text: 'delta', type: 'integer' }];

                    rows = _lodash2.default.map(r['raw-packets'], function (p) {
                        return [p['src-ts'], p['dst-ts'], p['dst-ts'] - p['src-ts']];
                    });
                }

                if (test_parameters.test.type == 'throughput') {
                    columns = [{ text: 'start', type: 'number' }, { text: 'end', type: 'end' }, { text: 'retransmits', type: 'integer' }, { text: 'bytes', type: 'integer' }];

                    rows = _lodash2.default.map(r['intervals'], function (p) {
                        return [p.summary.start, p.summary.end, p.summary.retransmits, p.summary['throughput-bytes']];
                    });
                }

                var data = {
                    columns: columns,
                    rows: rows,
                    type: 'table'
                };

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
