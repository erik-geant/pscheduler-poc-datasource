import _ from "lodash";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = {'Content-Type': 'application/json'};
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  testDatasource() {
    var url = this.url + '/json-proxy/connection-test';
    var backend_request = {
        withCredentials: this.withCredentials,
        headers: this.headers,
        url: url,
        method: 'GET'
    };
    console.log('testDatasource: ' + JSON.stringify(backend_request));

    return this.backendSrv.datasourceRequest(backend_request).then(
        r => {
          if (r.status === 200) {
            return {
              status: "success",
              message: "Data source is working",
              title: "Success"
            };
          }
        }
    );
  }

  make_latency_test_params(target) {
    return {
        'schema': 1,
        'schedule': {'slip': 'PT5M'},
        'test': {
            'spec': target.test_spec,
            'type': target.test_type
        }
    }
  }

  delay(t) {
    return new Promise(function(res, rej) {
        setTimeout(function() { res(); }, t);
    });
  }

  loop_until_finished(status_url, ds) {
    
    console.log('getting status from ' + status_url);

    var backend_request = {
        withCredentials: ds.withCredentials,
        headers: ds.headers,
        url: ds.url + '/json-proxy/get',
        method: 'POST',
        data: {url: status_url + '/runs/first'} 
    };


    return ds.delay(5000).then(function() {
        return ds.backendSrv.datasourceRequest(backend_request).then(
          r => {
            if (r.status !== 200) {
              return 'bad status: '  + r.status;
            }
 
            console.log('got task state: ' + r.data.state); 
            if (!_.includes(['pending', 'on-deck', 'running', 'finished'], r.data.state)) {
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
            return "can't find result key in response"
         }
       );
    });
  }
  
  get_measurement_result(mp_hostname, task_data) {

    var payload = {
        url: 'https://' + mp_hostname + '/pscheduler/tasks',
        parameters: task_data
    };

    console.log('get_measurement_results: ' + JSON.stringify(task_data))

    var backend_request = {
        withCredentials: this.withCredentials,
        headers: this.headers,
        url: this.url + '/json-proxy/post',
        method: 'POST',
        data: payload
    };

    return this.backendSrv.datasourceRequest(backend_request).then(
        r => {
            if (r.status === 200) {
                return this.loop_until_finished(r.data, this);
            } else {
                console.log('error, got status: ' + r.status);
                return 'bad request';
            }
        }
    );
  }

  _owpingts2epoch(owpts) {
    // cf. owamp/arithm64.c, OWPNum64ToTimespec
    var OWPJAN_1970 = 0x83aa7e80;
//    var epoch_seconds = (owpts >> 32) - OWPJAN_1970;
    var upper_32 = owpts / Math.pow(2,32);
    var epoch_seconds = (upper_32) - OWPJAN_1970;
    epoch_seconds -= OWPJAN_1970;
//    var nsec = ((owpts & 0xffffffff) * 1000000000) >> 32;
    var lower_32 = owpts - upper_32;
    var nsec = ((owpts - lower_32) * 1000000000) / Math.pow(2,32);
    var msec = Math.floor(nsec/1000000);
    var epoch_ts_with_ms = epoch_seconds + msec/1000.0;
    return epoch_ts_with_ms;
  }

  owpingts2epoch(owpts) {
    var OWPJAN_1970 = 0x83aa7e80;
    var upper_32 = owpts / Math.pow(2,32);
    var epoch_seconds = (upper_32) - OWPJAN_1970;
    return Math.floor(epoch_seconds * 1000)/1000;
  }


  make_latency_table(response) {
    var columns = [
        {text: 'src-ts', type: 'time'},
        {text: 'dst-ts', type: 'time'},
        {text: 'delta', type: 'number'}
    ];

    var rows = _.map(response['raw-packets'], p => {
        var src_ts = this.owpingts2epoch(p['src-ts']);
        var dst_ts = this.owpingts2epoch(p['dst-ts']);
        var delta = (p['dst-ts'] - p['src-ts'])/Math.pow(2,32);
        return [
            new Date(src_ts), 
            new Date(dst_ts),
            Math.floor(delta * 1000000)/1000
        ];
    });
 
     return {
      columns: columns,
      rows: rows,
      type: 'table'
    }
  }

  make_latency_timeseries(response) {
    return _.map(response['raw-packets'], p => {
        var src_ts = this.owpingts2epoch(p['src-ts']);
        var dst_ts = this.owpingts2epoch(p['dst-ts']);
        var delta = (p['dst-ts'] - p['src-ts'])/Math.pow(2,32);
        return [Math.floor(delta * 1000000)/1000, src_ts * 1000];
    });
  }

  make_throughput_table(response) {
    var columns = [
       {text: 'start', type: 'number'},
       {text: 'end', type: 'end'},
       {text: 'retransmits', type: 'integer'},
       {text: 'bytes', type: 'integer'}
    ]
    
    var rows = _.map(response['intervals'], p => {
        return [
            p.summary.start,
            p.summary.end,
            p.summary.retransmits,
            p.summary['throughput-bytes']
        ];
    });

    return {
      columns: columns,
      rows: rows,
      type: 'table'
    }
  }

  make_throughput_timeseries(response) {
    var times = _.map(response.intervals, p => { return p.summary.end; });
    var max_ts = _.max(times);
    var now = new Date().getTime();
    return _.map(response.intervals, p => {
        return [
            p.summary['throughput-bytes'],
            now - (p.summary.end - max_ts) * 1000
        ];
    });
  }


  query(options) {

//console.log('query(options): ' + JSON.stringify(options));

    var targets = options.targets.filter(t => !t.hide);


    if (targets === undefined || targets.length == 0) {
        return new Promise( (res, rej) => {
            return res({
                _request: { data: test_parameters},
                data: []
            });
        });
    }

    // just use the first target, as an experiement (for now only)

    var target = targets[0];
    var test_parameters = this.make_latency_test_params(target);
    var ds = this;

    var result_promise = this.get_measurement_result(target.source, test_parameters)

    return result_promise.then(r => {

         var data = null;

//console.log('target: ' + JSON.stringify(target));
//console.log('ds: ' + JSON.stringify(ds));
//console.log('result: ' + JSON.stringify(r));
         
         if (target.test_type == 'latency') {
            if (target.type == 'table') {
              data = ds.make_latency_table(r);
            } else {
              data = {
                target: target.refId,
                datapoints: ds.make_latency_timeseries(r)
              }
            }
         }

         if (target.test_type == 'throughput') {
            if (target.type == 'table') {
              data = ds.make_throughput_table(r);
            } else {
              data = {
                target: target.refId,
                datapoints: ds.make_throughput_timeseries(r)
              }
            }
         }
            
console.log('data: ' + JSON.stringify(data));
         
         return {
             _request: test_parameters,
             data: [data]
         };
    });
  }

  annotationQuery(options) {
    return [];
  }

  metricFindQuery(query) {
    console.log('metricFindQuery: IS THIS METHOD EVER CALLED?');
/*
    return Promise.resolve(
        [
            {text: 'm1', value: 'v1'},
            {text: 'm2', value: 'v2'}
        ]);
*/

    return [
        {text: 'm1', value: 'v1'},
        {text: 'm2', value: 'v2'}
    ];
  }

  getTagKeys(options) {
    return [];
  }

  getTagValues(options) {
    return [];
  }
}
