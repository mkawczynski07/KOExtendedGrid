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
        me.simpleData = ko.observableArray([
            {name: 'Jack', age: 12, nick: 'jackee'},
            {name: 'Olo', age: 32, nick: 'bolo'},
            {name: 'Klause', age: 150, nick: 'raven'},
            {name: 'John', age: 4, nick: 'pikpok'},
            {name: 'Mark', age: 66, nick: 'mark88'},
            {name: 'Lisabeth', age: 17, nick: 'wasp'}
        ]);
        me.models = ko.observableArray([
            new SimpleModel({name: 'Jack', age: 12, nick: 'jackee'}),
            new SimpleModel({name: 'Olo', age: 32, nick: 'bolo'}),
            new SimpleModel({name: 'Klause', age: 150, nick: 'raven'}),
            new SimpleModel({name: 'John', age: 4, nick: 'pikpok'}),
            new SimpleModel({name: 'Mark', age: 66, nick: 'mark88'}),
            new SimpleModel({name: 'Lisabeth', age: 17, nick: 'wasp'})
        ]);

        me.grid = new ko.extendedGrid.viewModel({
            data: me.models,
            model: SimpleModel
        });

        me.noModel = new ko.extendedGrid.viewModel({
            data: me.simpleData
        });

        me.filteringGrid = new ko.extendedGrid.viewModel({
            data: me.models,
            model: SimpleModel,
            filters: ['name'],
            filterScope: me
        });
    };


    $(document).ready(function() {
        ko.applyBindings(new model());
    });

})();