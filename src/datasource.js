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

  make_latency_test_params(source, destination) {
    var _test_spec = {
        'source': source,
        'dest': destination,
        'output-raw': true,
        'schema': 1
    };

    return {
        'schema': 1,
        'schedule': {'slip': 'PT5M'},
        'test': {
            'spec': _test_spec,
            'type': 'latency'
        }
    }
  }

  get_measurement_result(mp_hostname, task_data) {

    var payload = {
        'mp-hostname': mp_hostname,
        'task-data': task_data
    };

    var backend_request = {
        withCredentials: this.withCredentials,
        headers: this.headers,
        url: this.url + '/json-proxy/run-measurement',
        method: 'POST',
        data: payload
    };

    return this.backendSrv.datasourceRequest(backend_request).then(
        r => {
            return {
                _request: payload,
                response: r.data
            }
        }
        
    );
  }

  query(options) {

    var targets = options.targets.filter(t => !t.hide);

    var source = 'psmall-b-3.basnet.by';
    var destination = 'psmall-b-2.basnet.by';
    var test_parameters = this.make_latency_test_params(source, destination);

    if (targets === undefined || targets.length == 0) {
        return new Promise( (res, rej) => {
            return res({
                _request: { data: test_parameters},
                data: []
            });
        });
    }

    var result_promise = this.get_measurement_result(source, test_parameters)

    return result_promise.then(r => {

         var columns = [
             {text: 'src-ts', type: 'integer'},
             {text: 'dst-ts', type: 'integer'},
             {text: 'delta', type: 'integer'}
         ];

         var rows = _.map(r.response['raw-packets'], p => {
             return [
                 p['src-ts'],
                 p['dst-ts'],
                 p['dst-ts']-p['src-s']
             ];
         });

         var data = {
             columns: columns,
             rows: rows,
             type: 'table'
         }

         console.log('data: ' + JSON.stringify(data));
         
         return {
             _request: r._request,
             data: [data]
         };
    });
  }

  annotationQuery(options) {
    return Promise.resolve([]);
  }

  metricFindQuery(query) {
    return Promise.resolve(
        [
            {text: 'm1', value: 'v1'},
            {text: 'm2', value: 'v2'}
        ]);
  }

  getTagKeys(options) {
    return Promise.resolve([]);
  }

  getTagValues(options) {
    return Promise.resolve([]);
  }
}
