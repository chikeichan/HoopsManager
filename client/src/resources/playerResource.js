Trio.Module.export('playerResource', function() {
    var resource = Trio.Resource.register('playerResource');
    resource.createOne = function(payload) {
        return this.ajax({
            url: 'https://api.parse.com/1/classes/players',
            headers: {
                "X-Parse-Application-Id": 'BLnExPvX7WKmiMjjzs8U92ulSFSGJlGZlg2WWKQg',
                "X-Parse-REST-API-Key"  : 'N13rdzgEnxRt9ckcnGDWQncMF8IdvlKyiQsTuIv5'
            },
            type: 'POST',
            payload: payload,
            indexBy: 'objectId',
            parse: function(rsp) {
                rsp = JSON.parse(rsp);
                for (var k in payload) {
                    rsp[k] = payload[k];
                }
                return rsp;
            }
        })
    };

    resource.readOne = function(id) {
        return this.ajax({
            url: 'https://api.parse.com/1/classes/players?',
            headers: {
                "X-Parse-Application-Id": 'BLnExPvX7WKmiMjjzs8U92ulSFSGJlGZlg2WWKQg',
                "X-Parse-REST-API-Key"  : 'N13rdzgEnxRt9ckcnGDWQncMF8IdvlKyiQsTuIv5'
            },
            type: 'GET',
            payload: {
                objectId: id
            },
            indexBy: 'objectId',
            encode: function(obj) {
                return 'where={"objectId":"' + obj.objectId + '"}';
            }
        })
    };

    resource.parse = function(rsp) {
        return JSON.parse(rsp).results;
    }
});