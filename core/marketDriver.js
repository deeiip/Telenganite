/**
 * Created by dipanjan on 8/12/16.
 */
var default_config = require('./defaults.js');

var fs = require('fs');
var util = require('util');

// Or 'w' to truncate the file every time the process starts.
var logStdout = process.stdout;






//console.error = console.log;









//module.exports = connection;
module.exports = function (pair, callback_arr) {
    callback_arr = callback_arr | [];
    var create_logger = function (forWhat, type) {
        if (forWhat == 'btc_zec'){
            return function (location) {
                var logFile = fs.createWriteStream(default_config.datadir + default_config.filename['btc_zec'] + '_' + default_config.
                        types[type],
                    { flags: 'a+' });
                logFile.write(util.format.apply(null, arguments) + '\n');
                logStdout.write(util.format.apply(null, arguments) + '\n');
            };
        }
        if (forWhat == 'btc_xmr'){
            return function (location) {
                var logFile = fs.createWriteStream(default_config.datadir + default_config.filename['btc_xmr'] + '_' + default_config.
                        types[type],
                    { flags: 'a+' });
                logFile.write(util.format.apply(null, arguments) + '\n');
                logStdout.write(util.format.apply(null, arguments) + '\n');
            };
        }


    }


    var autobahn = require('autobahn');
    var wsuri = "wss://api.poloniex.com";
    var connection = new autobahn.Connection({
        url: wsuri,
        realm: "realm1"
    });

    var def_reporting_generic = function (arg, cur_pair) {

        for (var i = 0; i < arg.length; i++){
            if(arg[i].type == 'orderBookModify'){
                var logger = create_logger(cur_pair, 'edit');
                def_reporting_passive(arg[i].data, logger);
            }
            if (arg[i].type == 'newTrade'){
                var logger = create_logger(cur_pair, 'active');
                def_reporting_active(arg[i].data, logger);
            }
            if(arg[i].type == 'orderBookRemove'){
                var logger = create_logger(cur_pair, 'delete');
                def_reporting_passive(arg[i].data, logger);
            }
        }

    }

    var def_reporting_passive = function (data, writer) {
        //var zec_logger = create_logger('zec');
        if(data.amount == null){
            // delete order
            var type = data.type;
            var rate = data.rate;
            writer(type +','+ rate);
        }
        else {
            // edit order
            var type = data.type;
            var rate = data.rate;
            var amt = data.amount;
            writer(type +','+ rate + ',' + amt);
        }
        //writer(data);
    }

    var def_reporting_active = function (data, writer) {

        var amt = data.amount;
        var price = data.rate;
        var type = data.type;
        var date = data.date;

        writer(amt +','+price+','+type+','+date);
    }


    var handlers = [];
    handlers.push(def_reporting_generic);
    for( var i = 0; i < callback_arr.length; i++){
        handlers.push(callback_arr[i]);
    }
    connection.onopen = function (session) {
        // function marketEvent_zec (args,kwargs) {
        //     console.log(args);
        // }
        // function marketEvent_xmr (args,kwargs) {
        //     console.log(args);
        // }


        // for (var i = 0; i < pair.length; i++){
        //     session.subscribe(pair[i], function (args, kwargs) {
        //         for(var i = 0; i < handlers.length; i++){
        //             handlers[i](args, pair[i].toLowerCase());
        //         }
        //     });
        // }

        session.subscribe(pair, function (args, kwargs) {
            for(var i = 0; i < handlers.length; i++){
                handlers[i](args, pair.toLowerCase());
            }
        });

        //session.subscribe('BTC_ZEC', marketEvent);
        //session.subscribe('BTC_XMR', marketEvent_XMR);
        //session.subscribe('BTC_XMR', marketEvent);
        //session.subscribe('ticker', tickerEvent);
        //session.subscribe('trollbox', trollboxEvent);
    }

    connection.onclose = function () {
        console.log("Websocket connection closed");
    }
    return connection;
}