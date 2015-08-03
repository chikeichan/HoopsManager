Trio.Module.export('playerFactory', function() {
    var PlayerFactory = Trio.Factory.extend({
        defaults: {
            contractAmount: 0,
            contractLength: 0,
            salary: 0,
            weight: 0,
            dateOfBirth: Infinity,
            height: 0,
            weight: 0

        },
        initialize: function() {
            this.resource = Trio.Resource.get('playerResource');
            this.resource.readOne('kGFqJ5BIal')
                .then(function(rsp) {
                    this.set(rsp[0])
                }.bind(this));
        }
    });

    return PlayerFactory;
});