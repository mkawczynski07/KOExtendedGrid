(function() {

    SimpleModel = function(data) {
        this.name = ko.observable(data.name);
        this.age = ko.observable(data.age);
        this.nick = ko.observable(data.nick);
    };

    var model = function() {
        var me = this;
        me.name = ko.observable('');
        me.age = ko.observable();
        __me = me;
        me.models = ko.observableArray([
            new SimpleModel({name: 'Jasio', age: 12, nick: 'marchewa'}),
            new SimpleModel({name: 'Olo', age: 32, nick: 'bolo'}),
            new SimpleModel({name: 'Adam', age: 150, nick: 'raven'}),
            new SimpleModel({name: 'Gucio', age: 4, nick: 'pener'}),
            new SimpleModel({name: 'Kutwa', age: 66, nick: 'padaka'}),
            new SimpleModel({name: 'Mosznikow', age: 17, nick: 'koleś'})
        ]);
        me.grid = new ko.extendedGrid.viewModel({
            data: me.models,
            autoLoad: false,
            filters: ['name', 'age'],
            model: SimpleModel,
            filterScope: me
        });
    };


    $(document).ready(function() {
        ko.applyBindings(new model());
    });
})();