/**
 * Created by dipanjan on 8/12/16.
 */

var connection = require('./core/marketDriver')

connection('BTC_XMR').open();
connection('BTC_ZEC').open();