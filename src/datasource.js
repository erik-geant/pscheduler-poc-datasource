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

  make_latency_table(response) {
    var columns = [
        {text: 'src-ts', type: 'integer'},
        {text: 'dst-ts', type: 'integer'},
        {text: 'delta', type: 'integer'}
    ];

    var rows = _.map(response['raw-packets'], p => {
        return [
            p['src-ts'],
            p['dst-ts'],
            p['dst-ts']-p['src-ts']
        ];
    });
 
     return {
      columns: columns,
      rows: rows,
      type: 'table'
    }
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

  query(options) {

console.log('query(options): ' + JSON.stringify(options));

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

console.log('target: ' + JSON.stringify(target));
console.log('ds: ' + JSON.stringify(ds));
         
         if (target.test_type == 'latency') {
            data = ds.make_latency_table(r);
         }

         if (target.test_type == 'throughput') {
            data = ds.make_throughput_table(r);
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
