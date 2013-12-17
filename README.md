Knockout.js extension for presenting table data.  

# Requirements
 - knockout.js >= ***2.3.0***
 - jQuery >= ***1.8***

# Using
> KoExtendedGrid its simple to use. First you have to create
new ko.extendedGrid.viewModel() object in your view model. Then bind it
to html div element.

js :
```js
        me.simpleData = ko.observableArray([
            {name: 'Jack', age: 12, nick: 'jackee'},
            {name: 'Olo', age: 32, nick: 'bolo'},
            {name: 'Klause', age: 150, nick: 'raven'},
            {name: 'John', age: 4, nick: 'pikpok'},
            {name: 'Mark', age: 66, nick: 'mark88'},
            {name: 'Lisabeth', age: 17, nick: 'wasp'}
        ]);
        me.grid = new ko.extendedGrid.viewModel({
            data: me.simpleData
        });
```

html :
```html
        <div data-bind="extendedGrid: grid"></div>
```

# Models
> KoExtendedGrid provide support for data models. If you decide to use data models, 
the you can use extra functionalities like in line editing, action columns, filtering, etc.

js :
```js
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
```

html :
```html
        <div data-bind="extendedGrid: grid"></div>
```

# Filtering
> To use filters you have to work with data models.
There are three ways to define filter.

1. Using column name. Important thing is that you have to create observable property in your viewModel(filterScope)
named like column name.
js :
```js
        me.name = ko.observable('');
        me.age = ko.observable();
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
            model: SimpleModel,
            filters: ['name', 'age'],
            filterScope: me
        });
```

html :
```html
        <div data-bind="extendedGrid: grid"></div>
```

2. ddd