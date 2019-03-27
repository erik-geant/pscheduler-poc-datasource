'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericDatasourceQueryCtrl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sdk = require('app/plugins/sdk');

require('./css/query-editor.css!');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GenericDatasourceQueryCtrl = exports.GenericDatasourceQueryCtrl = function (_QueryCtrl) {
    _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

    function GenericDatasourceQueryCtrl($scope, $injector) {
        _classCallCheck(this, GenericDatasourceQueryCtrl);

        var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

        _this.scope = $scope;

        // general test params
        var default_panel_type = 'timeseries';
        var default_test_type = 'latency';
        var default_source = 'psmall-b-3.basnet.by';
        var default_destination = 'psmall-b-2.basnet.by';
        var default_ip_version = 4;

        // owping params
        var default_packet_count = 100;
        var default_packet_interval = .1;
        var default_packet_timeout = 0;

        // iperf3 params
        var default_duration = 'PT10S';

        _this.target.panel_type = _this.target.panel_type || default_panel_type;
        _this.target.source = _this.target.source || default_source;
        _this.target.destination = _this.target.destination || default_destination;
        _this.target.test_type = _this.target.test_type || default_test_type;

        _this.target.packet_count = _this.target.packet_count || default_packet_count;
        _this.target.packet_interval = _this.target.packet_interval || default_packet_interval;
        _this.target.packet_timeout = _this.target.packet_timeout || default_packet_timeout;
        _this.target.ip_version = _this.target.ip_version || default_ip_version;

        _this.target.duration = _this.target.duration || default_duration;

        _this.target.test_spec = _this.make_test_spec(_this.target);

        return _this;
    }

    _createClass(GenericDatasourceQueryCtrl, [{
        key: 'make_test_spec',
        value: function make_test_spec(t) {
            var _test_spec = {
                source: t.source,
                dest: t.destination,
                schema: 1
            };

            if (t.test_type == 'latency') {
                _test_spec['output-raw'] = true;
                _test_spec['ip-version'] = t.ip_version;
                _test_spec['packet-count'] = t.packet_count;
                _test_spec['packet-interval'] = t.packet_interval;
                _test_spec['packet-timeout'] = t.packet_timeout;
            }

            if (t.test_type == 'throughput') {
                _test_spec['ip-version'] = t.ip_version;
                _test_spec['duration'] = t.duration;
            }
            console.log('test_spec: ' + JSON.stringify(_test_spec));
            return _test_spec;
        }
    }, {
        key: 'getOptions',
        value: function getOptions(measurement_type, option_name) {
            var $options = [];

            if (measurement_type == 'latency' && option_name == 'packet-timeout') {
                $options = [{ text: '0', value: 0 }, { text: '.1', value: .1 }, { text: '1.0', value: 1.0 }];
            }
            if (measurement_type == 'latency' && option_name == 'packet-count') {
                $options = [{ text: '10', value: 10 }, { text: '50', value: 50 }, { text: '100', value: 100 }, { text: '250', value: 250 }];
            }
            if (measurement_type == 'latency' && option_name == 'packet-interval') {
                $options = [{ text: '.05', value: .05 }, { text: '.1', value: .1 }, { text: '.5', value: .5 }, { text: '1.0', value: 1.0 }];
            }

            if (measurement_type == 'throughput' && option_name == 'duration') {
                $options = [{ text: '5s', value: 'PT5S' }, { text: '10s', value: 'PT10S' }, { text: '30s', value: 'PT30S' }];
            }

            if (option_name == 'source' || option_name == 'destination') {
                $options = [{ text: 'psmall-b-3.basnet.by', value: 'psmall-b-3.basnet.by' }, { text: 'psmall-b-2.basnet.by', value: 'psmall-b-2.basnet.by' }];
            }

            if (option_name == 'ip-version') {
                $options = [{ text: 'ipv4', value: 4 }, { text: 'ipv6', value: 6 }];
            }

            if (option_name == 'test-type') {
                $options = [{ text: 'latency', value: 'latency' }, { text: 'throughput', value: 'throughput' }];
            }

            if (option_name == 'panel-type') {
                $options = [{ text: 'timeseries', value: 'timeseries' }, { text: 'table', value: 'table' }];
            }

            return $options;

            /*
                return this.datasource.metricFindQuery({
                    type: type_name,
                    option: option_name
                });
            */
        }
    }, {
        key: 'toggleEditorMode',
        value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
        }
    }, {
        key: 'onChangeInternal',
        value: function onChangeInternal() {
            this.target.test_spec = this.make_test_spec(this.target);
            //    this.panelCtrl.refresh(); // Asks the panel to refresh data.
        }
    }]);

    return GenericDatasourceQueryCtrl;
}(_sdk.QueryCtrl);

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
//# sourceMappingURL=query_ctrl.js.map
