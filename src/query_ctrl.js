import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector)  {
    super($scope, $injector);

    this.scope = $scope;

    var default_mp = 'not set';
    var default_task = 'not set';

    this.target.mp =
        this.target.mp || default_mp;
    this.target.task =
        this.target.task || default_task;
  }

//   getOptions(measurement_type, option_name) {
//     var $options = [];
// 
//     if (measurement_type == 'latency' && option_name == 'packet-timeout') {
//         $options = [
//             {text: '0', value: 0},
//             {text: '.1', value: .1},
//             {text: '1.0', value: 1.0}
//         ];
//     }
//     if (measurement_type == 'latency' && option_name == 'packet-count') {
//         $options = [
//             {text: '10', value: 10},
//             {text: '50', value: 50},
//             {text: '100', value: 100},
//             {text: '250', value: 250}
//         ];
//     }
//     if (measurement_type == 'latency' && option_name == 'packet-interval') {
//         $options = [
//             {text: '.05', value: .05},
//             {text: '.1', value: .1},
//             {text: '.5', value: .5},
//             {text: '1.0', value: 1.0}
//         ];
//     }
// 
//     if (measurement_type == 'throughput' && option_name == 'duration') {
//         $options = [
//             {text: '5s', value: 'PT5S'},
//             {text: '10s', value: 'PT10S'},
//             {text: '30s', value: 'PT30S'}
//         ];
//     }
// 
//     if (option_name == 'source' || option_name == 'destination') {
//         $options = [
//             {text: 'psmall-b-3.basnet.by', value: 'psmall-b-3.basnet.by'},
//             {text: 'psmall-b-2.basnet.by', value: 'psmall-b-2.basnet.by'},
//         ];
//     }
// 
//     if (option_name == 'ip-version') {
//         $options = [
//             {text: 'ipv4', value: 4},
//             {text: 'ipv6', value: 6},
//         ];
//     }
// 
//     if (option_name == 'test-type') {
//         $options = [
//             {text: 'latency', value: 'latency'},
//             {text: 'throughput', value: 'throughput'}
//         ];
//     }
// 
//     if (option_name == 'panel-type') {
//         $options = [
//             {text: 'timeseries', value: 'timeseries'},
//             {text: 'table', value: 'table'}
//         ];
//     }
// 
//     return $options;
// 
// /*
//     return this.datasource.metricFindQuery({
//         type: type_name,
//         option: option_name
//     });
// */
//   }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

