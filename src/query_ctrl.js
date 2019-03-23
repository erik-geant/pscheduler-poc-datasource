import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector)  {
    super($scope, $injector);

    this.scope = $scope;

    // general test params
    var default_test_type = 'latency'
    var default_source = 'psmall-b-3.basnet.by';
    var default_destination = 'psmall-b-2.basnet.by';
    var default_ip_version = 4;

    // owping params
    var default_packet_count = 100;
    var default_packet_interval = .1;
    var default_packet_timeout = 0;

    // iperf3 params
    var default_duration = 'PT10S';

    this.target.source =
        this.target.source || default_source;
    this.target.destination =
        this.target.destination || default_destination;
    this.target.test_type =
        this.target.test_type || default_test_type;

    this.target.packet_count =
        this.target.packet_count || default_packet_count;
    this.target.packet_interval =
        this.target.packet_interval || default_packet_interval;
    this.target.packet_timeout =
        this.target.packet_timeout || default_packet_timeout;
    this.target.ip_version =
        this.target.ip_version || default_ip_version;

    this.target.duration =
        this.target.duration || default_duration;

    this.target.test_spec = this.make_test_spec(this.target)

  }

  make_test_spec(t) {
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

  getOptions(measurement_type, option_name) {
    var $options = [];

    if (measurement_type == 'latency' && option_name == 'packet-timeout') {
        $options = [
            {text: '0', value: 0},
            {text: '.1', value: .1},
            {text: '1.0', value: 1.0}
        ];
    }
    if (measurement_type == 'latency' && option_name == 'packet-count') {
        $options = [
            {text: '10', value: 10},
            {text: '50', value: 50},
            {text: '100', value: 100},
            {text: '250', value: 250}
        ];
    }
    if (measurement_type == 'latency' && option_name == 'packet-interval') {
        $options = [
            {text: '.05', value: .05},
            {text: '.1', value: .1},
            {text: '.5', value: .5},
            {text: '1.0', value: 1.0}
        ];
    }

    if (measurement_type == 'throughput' && option_name == 'duration') {
        $options = [
            {text: '5s', value: 'PT5S'},
            {text: '10s', value: 'PT10S'},
            {text: '30s', value: 'PT30S'}
        ];
    }

    if (option_name == 'source' || option_name == 'destination') {
        $options = [
            {text: 'psmall-b-3.basnet.by', value: 'psmall-b-3.basnet.by'},
            {text: 'psmall-b-2.basnet.by', value: 'psmall-b-2.basnet.by'},
        ];
    }

    if (option_name == 'ip-version') {
        $options = [
            {text: 'ipv4', value: 4},
            {text: 'ipv6', value: 6},
        ];
    }

    if (option_name == 'test-type') {
        $options = [
            {text: 'latency', value: 'latency'},
            {text: 'throughput', value: 'throughput'}
        ];
    }



    return $options;

/*
    return this.datasource.metricFindQuery({
        type: type_name,
        option: option_name
    });
*/
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.target.test_spec = this.make_test_spec(this.target);
//    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

