(function() {

    var filterStates = {
        'function': function(conf) {
            return conf.filter.call(conf.filterScope, conf.item);
        },
        'object': function(conf) {
            return filterProperty(conf.filter.value, conf.item, conf.item[conf.filter.property]());
        },
        'string': function(conf) {
            return filterProperty(conf.filterScope[conf.filter], conf.item, conf.item[conf.filter]());
        }
    },
    isFunction = function(fn) {
        return typeof fn === 'function';
    },
            isDefined = function(object) {
                return typeof object !== 'undefined';
            },
            isUnDefined = function(object) {
                return isDefined(object) === false;
            },
            loop = function(data, fn) {
                var x = 0,
                        length = data.length, item,
                        shouldExecuteFn = isFunction(fn);
                for (x; x < length; x++) {
                    item = data[x];
                    if (shouldExecuteFn === true) {
                        fn.call(item, item, data);
                    }
                }
            },
            filterProperty = function(filterProperty, item, itemProperty) {
                var propertyValue = filterProperty(),
                        regExp = makeFilterRegExpPattern(propertyValue);
                if (isDefined(propertyValue) === false) {
                    return item;
                }
                if (propertyValue.length === 0) {
                    return item;
                }
                if (regExp.test(itemProperty)) {
                    return item;
                }
            },
            makeFilterRegExpPattern = function(value) {
                var pattern = "";
                value = value + '';
                pattern = value.replace(/%/g, '.*');
                pattern = value.replace(/\*/g, '.*');
                pattern = pattern.replace(/_/g, '.');
                return new RegExp(pattern, "i");
            },
            loadData = function(config) {
                config = config || {};
                config.usingResponseModel = config.usingResponseModel || false;
                $.ajax({
                    dataType: config.dataType || "json",
                    url: config.url,
                    cache: config.cache || false,
                    success: function(response) {
                        var doCallback = false;
                        if (config.usingResponseModel) {
                            if (response.success) {
                                doCallback = true;
                            } else {
                                alert(response.message);
                            }
                        }
                        if (doCallback === true && isFunction(config.callback)) {
                            config.callback.call(config.scope || this, response);
                        }
                    }
                });
            },
            mapAsModels = function(records, Model) {
                var result = [];
                records = records || [];
                loop(records, function(record) {
                    result.push(new Model(record));
                });
                return result;
            },
            getColumnsForScaffolding = function(data) {
                var columns = [], propertyName;
                if ((typeof data.length !== 'number') || data.length === 0) {
                    return columns;
                }
                for (propertyName in data[0]) {
                    columns.push({
                        headerText: propertyName,
                        rowText: propertyName
                    });
                }
                return columns;
            };

    ko.extendedGrid = {
        viewModel: function(configuration) {
            var me = this;

            me.afterRender = configuration.afterRender;
            me.shouldLoadData = configuration.url || false;
            if (isDefined(configuration.autoLoad)) {
                me.autoLoad = configuration.autoLoad;
            } else {
                me.autoLoad = true;
            }
            me.model = configuration.model;
            me.originalData = configuration.data || [];
            me.tableClass = configuration.tableClass || 'table';
            me.pageSize = configuration.pageSize || 5;
            me.paginatorText = configuration.paginatorText || 'Page : ';
            me.filters = configuration.filters || [];
            me.filterScope = configuration.filterScope || me;
            me.lazyLoading = configuration.lazyLoading || false;
            me.pageNumberParamName = configuration.pageNumberParamName || 'number';
            me.pageSizeParamNumber = configuration.pageSizeParamNumber || 'size';

            me.dataLength = ko.observable(0);
            me.isFiltering = me.filters.length > 0;
            me.currentPageIndex = ko.observable(0);

            me.data = ko.computed(function() {
                if (!me.isFiltering) {
                    return me.originalData();
                }
                return ko.utils.arrayFilter(me.originalData(), function(item) {
                    var filterLength = me.filters.length,
                            x = 0, filter,
                            filterType;
                    for (x; x < filterLength; x++) {
                        filter = me.filters[x];
                        filterType = typeof filter;
                        if (isFunction(filterStates[filterType])) {
                            if (filterStates[filterType].call(me, {
                                filter: filter,
                                filterScope: me.filterScope,
                                item: item
                            }) === undefined) {
                                return;
                            }
                        }
                    }
                    return item;
                });
            }, me);

            me.columns = configuration.columns || getColumnsForScaffolding(ko.utils.unwrapObservable(me.data));

            me.itemsOnCurrentPage = ko.computed(function() {
                if (me.lazyLoading === true) {
                    return me.data();
                } else {
                    var startIndex = me.pageSize * me.currentPageIndex();
                    return me.data().slice(startIndex, startIndex + me.pageSize);
                }
            }, me);

            me.maxPageIndex = ko.computed(function() {
                var length;
                if (me.lazyLoading === true) {
                    length = me.dataLength();
                } else {
                    length = ko.utils.unwrapObservable(me.data).length;
                }
                return Math.ceil(length / me.pageSize) - 1;
            }, me);

            me.loadData = function(callback) {
                var url = me.getUrl();
                loadData({
                    url: url,
                    callback: function(response) {
                        me.afterLoad(response, callback);
                    }
                });
            };

            me.getUrl = function() {
                var url;
                if (isFunction(configuration.url)) {
                    url = configuration.url.call(me);
                } else {
                    url = configuration.url;
                }
                url = me.appendPaggingIfLazyLoadingEnable(url);
                return  url;
            };

            me.appendPaggingIfLazyLoadingEnable = function(url) {
                if (me.lazyLoading === false) {
                    return;
                }
                if (url.lastIndexOf('&') !== (url.length - 1)) {
                    url += '?';
                }
                url += +me.pageNumberParamName + "=" + me.currentPageIndex();
                url += "&" + me.pageSizeParamNumber + "=" + me.pageSize;
                return url;
            };

            me.afterLoad = function(response, callback) {
                me.dataLength(Number(response.size));
                if (isFunction(me.model)) {
                    me.originalData(mapAsModels(response.data, me.model));
                } else {
                    me.originalData(response.data);
                }
                if (isFunction(callback)) {
                    callback.call(me, response);
                }
            };

            me.getRecord = function(record, column) {
                var json, copy,
                        createCopy = isDefined(column.createCopy) ? column.createCopy : false;
                if (createCopy) {
                    json = ko.toJSON(record);
                    copy = JSON.parse(json);
                    return copy;
                }
                return record;
            };

            me.isTextColumn = function(column) {
                var isAction = isUnDefined(column.isActionColumn) ? false : column.isActionColumn,
                        isImageColumn = isUnDefined(column.isImageColumn) ? false : column.isImageColumn,
                        edit = isUnDefined(column.edit) ? false : true;
                return (isAction === false) && (isImageColumn === false) && (edit === false);
            };

            me.isActionImageColumn = function(column) {
                var isAction = isUnDefined(column.isActionColumn) ? false : column.isActionColumn,
                        isImageColumn = isUnDefined(column.isImageColumn) ? false : column.isImageColumn,
                        edit = isUnDefined(column.edit) ? false : true;
                return (isAction === true) && (isImageColumn === true) && (edit === false);
            };

            me.isActionColumn = function(column) {
                var isAction = isUnDefined(column.isActionColumn) ? false : column.isActionColumn,
                        isImageColumn = isUnDefined(column.isImageColumn) ? false : column.isImageColumn,
                        edit = isUnDefined(column.edit) ? false : true;
                return isAction && (isImageColumn === false) && (edit === false);
            };

            me.isImageColumn = function(column) {
                var isAction = isUnDefined(column.isActionColumn) ? false : column.isActionColumn,
                        isImageColumn = isUnDefined(column.isImageColumn) ? false : column.isImageColumn,
                        edit = isUnDefined(column.edit) ? false : true;
                return (isAction === false) && isImageColumn && (edit === false);
            };

            me.isEditColumn = function(column) {
                return isUnDefined(column.edit) ? false : true;
            };

            me.shouldShowColumn = function(column, record) {
                var show = column.show || true;
                if (isFunction(show)) {
                    show = show.call(me, record);
                }
                return show;
            };

            me.isInput = function(column) {
                return column.editor === 'input';
            };

            me.isSelect = function(column) {
                return column.editor === 'select';
            };

            me.isCheckbox = function(column) {
                return column.editor === 'checkbox';
            };

            me.jumpToFirstPage = function() {
                me.currentPageIndex(0);
            };

            me.defaultFilterFunction = function(item) {
                return item;
            };

            me.getColumnAttributes = function(parent, column) {
                var attributes = column.attributes || {};
                if (isFunction(attributes)) {
                    attributes = attributes.call(me, me.getRecord(parent, column));
                }
                return attributes;
            };
            me.getImageColumnAttributes = function(parent, column, image, title) {
                var attributes = me.getColumnAttributes(parent, column);
                attributes.src = image;
                attributes.title = title;
                return attributes;
            };

            me.shouldEnableCell = function(column, parent) {
                if (column.enable) {
                    if (isFunction(column.enable)) {
                        return column.enable.call(me, me.getRecord(parent, column));
                    } else {
                        return column.enable;
                    }
                }
                return true;
            };

            me.getEvents = function(column, parent) {
                var events = {}, x = 0, event, eventFunction;
                if (column.events) {
                    for (event in column.events) {
                        events[event] = function(c, e) {
                            var record = me.getRecord(parent, column);
                            eventFunction = column.events[event];
                            if (isFunction(eventFunction)) {
                                eventFunction.call(me.scope || me, record, c, e);
                            }
                        };
                    }
                }
                return events;
            };
            me.onPagingClick = function(data) {
                me.currentPageIndex(data);
                if (me.lazyLoading === true) {
                    me.loadData();
                }
            };
        }
    };

    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function(templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    templateEngine.addTemplate("ko_simpleGrid_pageLinks", "\
                    <div class=\"ko-grid-pageLinks\">\
                        <div class=\"btn-toolbar\" style=\"float:left;\">\
                            <div class=\"btn-group btn-group-xs\">\
                                <!-- ko foreach: ko.utils.range(0, maxPageIndex) -->\
                                     <button class=\"btn btn-default\" data-bind=\"text: $data + 1, click: function() { $root.onPagingClick($data); }, css: { 'btn-info': $data == $root.currentPageIndex() }\"></button>\
                                <!-- /ko -->\
                            </div>\
                        </div>\
                    </div>");
    templateEngine.addTemplate("ko_simpleGrid_grid", "\
                    <table style=\"display: none\" class=\"ko-grid \" data-bind=\"css: $root.tableClass\" cellspacing=\"0\" border=\"0\" cellpadding=\"0\">\
                        <thead>\
                            <tr data-bind=\"foreach: columns\">\
                               <th>\
                                    <span data-bind=\"text: headerText\" /></td>\
                               </th>\
                            </tr>\
                        </thead>\
                        <tbody data-bind=\"foreach: itemsOnCurrentPage\">\
                           <tr data-bind=\"foreach: $parent.columns\" class=\"even\">\
                               <!-- ko if: $root.isTextColumn($data)  --> \
                                    <td><span data-bind=\"text: typeof rowText == 'function' ? rowText($parent) : $parent[rowText], visible: $root.shouldShowColumn($data, $root.getRecord($parent, $data)), css: $data.css || {}, attr: $root.getColumnAttributes($parent, $data)\"/> \
                                    </td> \
                               <!-- /ko -->\
                               <!-- ko if: $root.isActionImageColumn($data) --> \
                                    <td><span data-bind=\"visible: $root.shouldShowColumn($data, $root.getRecord($parent, $data)), css: $data.css || {}\">\
                                        <a href=\"#\" data-bind=\"click: function(data, event) { $data.actionCallback(data, event, $root.getRecord($parent, data)); return false; }\">\
                                            <img data-bind=\"attr:{src: $root.getApplicationContextPath() + '/' + image($parent), alt: title($root.getRecord($parent, $data)), title: title($root.getRecord($parent, $data))}\"/>\
                                        </a></span>\
                                    </td>\
                               <!-- /ko -->\
                               <!-- ko if: $root.isActionColumn($data) --> \
                                    <td><span data-bind=\"visible: $root.shouldShowColumn($data, $root.getRecord($parent, $data)), css: $data.css || {}\">\
                                        <a href=\"#\" data-bind=\"click: function(data, event) { $data.actionCallback(data, event, $root.getRecord($parent, data)); return false; }\">\
                                            <img data-bind=\"attr:{src: $root.getApplicationContextPath() + '/' + actionImg, alt: actionTitle, title: actionTitle}\"/>\
                                        </a></span>\
                                    </td>\
                               <!-- /ko -->\
                               <!-- ko if: $root.isImageColumn($data) --> \
                                    <td><span data-bind=\"visible: $root.shouldShowColumn($data, $root.getRecord($parent, $data)), css: $data.css || {}\">\
                                        <img data-bind=\"attr: $root.getImageColumnAttributes($parent, $data, image($parent), title($root.getRecord($parent, $data))) \"/>\
                                    </span></td>\
                               <!-- /ko -->\
                               <!-- ko if: $root.isEditColumn($data) --> \
                                    <td><span data-bind=\"visible: $root.shouldShowColumn($data, $root.getRecord($parent, $data)), css: $data.css || {}\">\
                                        <!-- ko if: $root.isInput($data) -->\
                                                <input data-bind=\"value: $data.value || $parent[rowText], css: $data.editorCss || {}, valueUpdate: $data.valueUpdate || 'afterkeydown', attr: $root.getColumnAttributes($parent, $data), style: $data.style || {}, enable: $root.shouldEnableCell($data, $parent), event: $root.getEvents($data, $parent)\"/>\
                                        <!-- /ko -->\
                                        <!-- ko if: $root.isSelect($data) -->\
                                                <select data-bind=\"dictionary : $data.dictionary || {}, css: $data.editorCss || {}, options: $data.options, optionsText: $data.optionsText, optionsValue: $data.optionsValue, value: $parent[rowText], valueUpdate: $data.valueUpdate || 'afterkeydown', attr: $root.getColumnAttributes($parent, $data), style: $data.style || {}, event: $root.getEvents($data, $parent), enable: $root.shouldEnableCell($data, $parent)\"></select>\
                                        <!-- /ko -->\
                                        <!-- ko if: $root.isCheckbox($data) -->\
                                                <input type=\"checkbox\" data-bind=\"checked: $data.value || $parent[rowText], css: $data.editorCss || {}, valueUpdate: $data.valueUpdate || 'afterkeydown', attr: $root.getColumnAttributes($parent, $data), style: $data.style || {}, enable: $root.shouldEnableCell($data, $parent), event: $root.getEvents($data, $parent)\"/>\
                                        <!-- /ko -->\
                                    </span></td>\
                               <!-- /ko -->\
                            </tr>\
                        </tbody>\
                    </table>");

    // The "simpleGrid" binding
    ko.bindingHandlers.extendedGrid = {
        init: function(element, viewModelAccessor) {
            var viewModel = viewModelAccessor();
            if (viewModel.shouldLoadData) {
                if (viewModel.autoLoad) {
                    viewModel.loadData();
                }
            }
            return {'controlsDescendantBindings': true};
        },
        // This method is called to initialize the node, and will also be called again if you change what the grid is bound to
        update: function(element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            // Empty the element
            while (element.firstChild)
                ko.removeNode(element.firstChild);

            // Allow the default templates to be overridden
            var gridTemplateName = allBindings.simpleGridTemplate || "ko_simpleGrid_grid",
                    pageLinksTemplateName = allBindings.simpleGridPagerTemplate || "ko_simpleGrid_pageLinks";

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(gridTemplateName, viewModel, {templateEngine: templateEngine}, gridContainer, "replaceNode");

            // Render the page links
            var pageLinksContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(pageLinksTemplateName, viewModel, {templateEngine: templateEngine}, pageLinksContainer, "replaceNode");

            element.children[0].style.display = 'block';

            if (isFunction(viewModel.afterRender)) {
                viewModel.afterRender.call(viewModel.scope || viewModel, element, viewModel);
            }
        }
    };
})();