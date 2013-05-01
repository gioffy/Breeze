/// <reference path="datajs/datajs-1.1.0.js" />
/// <reference path="q/q.js"/>
/// <reference path="OQuery/oQuery.mod.js"/>
/// <reference path="iblade/core.js" />
/// <reference path="iblade/entitymetadata.js"/>
/// <reference path="iblade/entitymanager.js"/>
/// <reference path="iblade/entity.js"/>
// above stuff for resharper - but doesn't work

require.config({ baseUrl: "Scripts/IBlade" });
define(["testFns"], function (testFns) {
    var breeze = testFns.breeze;
    var core = breeze.core;
    

    var EntityType = breeze.EntityType;
    var MetadataStore = breeze.MetadataStore;
    var EntityManager = breeze.EntityManager;
    var NamingConvention = breeze.NamingConvention;
    var EntityQuery = breeze.EntityQuery;

    var newEm = testFns.newEm;

    module("metadata", {
        setup: function () {
            testFns.setup();
        },
        teardown: function () {

        }
    });

    test("default interface impl", function() {
        var store = new MetadataStore();
        stop();
        store.fetchMetadata(testFns.serviceName).then(function() {
            ok(!store.isEmpty());
            start();
        }).fail(testFns.handleFail);
    });

    test("getEntityType informative error message1", function () {
        var store = new MetadataStore();
        var em = new EntityManager({ serviceName: testFns.serviceName, metadataStore: store });

        try {
            var customer = em.createEntity("Customer", { customerID: breeze.core.getUuid() });
            ok(false, "Shouldn't get here");
        } catch (err) {
            ok(err.message.indexOf("fetchMetadata") !== -1, "The error message should say to ensure metadata is fetched.");
        }
    });

    test("getEntityType informative error message2", function () {
        var store = new MetadataStore();
        var em = new EntityManager({ serviceName: testFns.serviceName, metadataStore: store });

        try {
            var productType = em.metadataStore.getEntityType("Customer");
            ok(false, "Shouldn't get here");
        } catch (err) {
            ok(err.message.indexOf("fetchMetadata") !== -1, "The error message should say to ensure metadata is fetched.");
        }
    });
    
    test("initialization", function () {

        var store = new MetadataStore({ namingConvention: NamingConvention.none } );
        stop();
        var dataServiceAdapter = core.config.getAdapterInstance("dataService");
        var dataService = new breeze.DataService({ serviceName: testFns.serviceName });
        dataServiceAdapter.fetchMetadata(store, dataService).then(function() {
            try {
                var typeMap = store._structuralTypeMap;
                var types = objectValues(typeMap);
                ok(types.length > 0);
                var custType = store.getEntityType("Customer");
                var props = custType.dataProperties;
                ok(props.length > 0);
                var keys = custType.keyProperties;
                ok(keys.length > 0);
                var prop = custType.getProperty("CustomerID");
                ok(prop);
                ok(prop.isDataProperty);
                var navProp = custType.navigationProperties[0];
                ok(navProp.isNavigationProperty);
                var notProp = custType.getProperty("foo");
                ok(!notProp);
                equal(prop.name, keys[0].name);
                
            } catch(e) {
                ok(false, "should'nt fail except if using server side json metadata file.");
            }
        }).fail(testFns.handleFail).fin(start);
    });

    test("initialize only once", function() {
        var store = new MetadataStore();
        var em = new EntityManager({ serviceName: testFns.serviceName, metadataStore: store });
        stop();
        store.fetchMetadata(testFns.serviceName).then(function () {
            ok(!store.isEmpty());
            ok(store.hasMetadataFor(testFns.serviceName));
            ok(em.metadataStore.hasMetadataFor(em.serviceName), "manager serviceName is not the same as the metadataStore name");

        }).fail(testFns.handleFail).fin(start);
    });

    test("initialization concurrent", 2, function () {

        var store = new MetadataStore();
        var sc = new testFns.StopCount(2);
        var typeMap;
        var errFn = function (e) {
            ok(false, e);
        };
        var dataServiceAdapter = core.config.getAdapterInstance("dataService");
        var dataService = new breeze.DataService({ serviceName: testFns.serviceName });
        
        var p1 = dataServiceAdapter.fetchMetadata(store, dataService).then(function () {
            typeMap = store._structuralTypeMap;
            ok(true, "should get here");

        });
        var p2 = dataServiceAdapter.fetchMetadata(store, dataService).then(function () {
            typeMap = store._structuralTypeMap;
            ok(true, "should also get here");
            
        });
        Q.all([p1, p2]).fail(errFn).fin(start);
    });

    function objectValues(obj, deep) {
        deep = deep || false;
        var result = [];
        for (var name in obj) {
            if (deep || obj.hasOwnProperty(name)) {
                result.push(obj[name]);
            }
        }
        return result;
    }

    return testFns;
});
