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
    var url = this.url + '/version';
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


    return this.backendSrv.datasourceRequest(backend_request).then(
        r => {
            if (r.status != 200) {
                console.log('error, got status: ' + r.status);
                return 'bad request';
            }
            var ts_data = {
              target: target.refId,
              datapoints: _.map(r.data, p => {
                return [p[0], 1000*p[1]];
              })
            };
            return {
                _request: backend_request,
                data: [ts_data]
            };
        }
    );
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
