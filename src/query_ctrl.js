import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector)  {
    super($scope, $injector);

    this.scope = $scope;

    var default_test_type = 'latency'

    // owping params
    var default_packet_count = 100;
    var default_packet_interval = .1;
    var default_packet_timeout = 0;
    var default_ip_version = 4;

    // iperf3 params
    var default_duration = 10;

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
            {text: '5', value: 5},
            {text: '10', value: 10},
            {text: '30', value: 30}
        ];
    }

    if (option_name == 'ip-version') {
        $options = [
            {text: 'ipv4', value: 4},
            {text: 'ipv6', value: 6},
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
//    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

