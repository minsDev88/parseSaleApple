var fs = require('fs');
var csv = require('csv');
var http = require('http');

var saleData = {};

var options = {
	username : '',
	password : '',
	vndnumber : ''
}

var yesterDayStr = '';

var httpURL = "http://edudev.uangel.com:7000/tomo-svc/rest/analytics/A";

http.get( httpURL, function(res){
        console.log("Got Response : " + res.statusCode );
        if( res.statusCode == "200" ) {
                res.on("data", function(chunk) {
					getReport(chunk, parseSaleCSV);
                });     
        }               
}).on('error', function(e) {
        console.log("Got error : " + e.message );
});
   

fs.readFile(__dirname + '/filter.dat', 'utf8', function(error, data){
	console.log("Write Sale Report Apple", new Date() );

	// getReport(data, parseSaleCSV);
});

var getReport = function(filterData, callback){

	var ingest = require (__dirname + '/lib/nodeingest').create(options);

	var tmpDate = new Date();
	var yesterDay = new Date(new Date( tmpDate.getFullYear() + '-' + (tmpDate.getMonth() + 1 ) + '-' + ( tmpDate.getDate() ) + ' 00:00:00') - 1 - 1000*60*60*24);
	yesterDayStr = yesterDay.getFullYear();
	yesterDayStr += '' + ( ( yesterDay.getMonth() + 1 < 10 ) ? '0' : '' ) + (yesterDay.getMonth() + 1);
	yesterDayStr += '' + ( ( yesterDay.getDate() + 1 < 10 ) ? '0' : '' ) + (yesterDay.getDate());
	// yesterDayStr += '' + yesterDay.getDate();

	console.log( yesterDayStr);

	var fetch_options = {
		typeofreport : 'Sales',
		datetype : 'Daily',
		reporttype : 'Summary',
		// reportdate : '20130828'
		reportdate : yesterDayStr
	};

	ingest.fetch( fetch_options, function( error, report ) {
		if( error ){
			console.log(error);
		} else {
			console.log('Success Get Report');
			callback(filterData, report);
		}
	});
}

var parseSaleCSV = function(filterData, report){

	saleData = JSON.parse(filterData);

	console.log(saleData);

	for( var i = 0; i < report.length; i++ ){

		// 구매 관련 데이터 저장하여 가지고 있는 변수
		var info = info || {};
		info.parent_Identifier = report[i][ 'Parent Identifier' ];
		info.sku = report[i][ 'SKU' ];
		info.product_Type_Identifier = report[i][ 'Product Type Identifier' ];
		info.currency = report[i][ 'Customer Currency' ];
		info.units = Number( report[i]['Units'] );
		info.price = Number( report[i][ 'Customer Price' ].replace(',', '' ) );


		info.cnt = (info.units <= -1) ? -1 : 1;

		// 앱을 구매하여 다운을 받는 경우(유료, 무료 둘 다 해당)
		if( typeof saleData[ info.sku ] !== 'undefined' 
			&& (info.product_Type_Identifier === '1' || info.product_Type_Identifier === '1F' ) ){

			// 설치횟수 정보를 초기화 시키고 증가시킨다.
			saleData[ info.sku ].installCount = saleData[ info.sku ].installCount || 0;
			saleData[ info.sku ].installCount += 1;

			// 만약 돈이 0원이 아닐 경우 화폐단위를 키 값으로 하여 객체를 생성하여 화폐단위로 과금 금액을 구분한다.
			if ( info.price !== 0 ) {

				// 데이터 초기화
				saleData[ info.sku ].currency = saleData[ info.sku ].currency || {};
				saleData[ info.sku ].currency[ info.currency ] = saleData[ info.sku ].currency[ info.currency ] || {};

				// 횟수, 금액 초기화 및 값 증가
				saleData[ info.sku ].currency[ info.currency ].chargedRefundCount = saleData[ info.sku ].currency[ info.currency ].chargedRefundCount || 0;
				saleData[ info.sku ].currency[ info.currency ].chargedRefundCount += 1;

				if( info.cnt > 0 ){
					saleData[ info.sku ].currency[ info.currency ].chargedCount = saleData[ info.sku ].currency[ info.currency ].chargedCount || 0;
					saleData[ info.sku ].currency[ info.currency ].chargedCount += 1;
				} else { 
					saleData[ info.sku ].currency[ info.currency ].refundCount = saleData[ info.sku ].currency[ info.currency ].refundCount || 0;
					saleData[ info.sku ].currency[ info.currency ].refundCount += 1;
				}
				saleData[ info.sku ].currency[ info.currency ].money = saleData[ info.sku ].currency[ info.currency ].money || 0;
				saleData[ info.sku ].currency[ info.currency ].money += info.price;
			}
		}
		// 토모키즈 앱에 인앱을 구매한 경우
		else if( info.product_Type_Identifier === 'IA1' && info.parent_Identifier === 'TOMOKIDS_001' ){

			// 데이터 초기화
			saleData[ info.parent_Identifier ].inApp = saleData[ info.parent_Identifier ].inApp || {};
			saleData[ info.parent_Identifier ].inApp[ info.currency ] = saleData[ info.parent_Identifier ].inApp[ info.currency ] || {};
			saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ] = saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ] || {};

			// 횟수, 금액 초기화 및 값 증가
			saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedRefundCount = saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedRefundCount || 0;
			saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedRefundCount += 1;

			if( info.cnt > 0 ){
				saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedCount = saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedCount || 0;
				saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedCount += 1;
			} else {
				saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].refundCount = saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].chargedCount || 0;
				saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].refundCount += 1;
			}
			saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].money = saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].money || 0;
			saleData[ info.parent_Identifier ].inApp[ info.currency ][ info.price ].money += info.price;

		}
		// 인앱을 구매하는 경우(유료, 무료 둘다 해당)
		else if( info.product_Type_Identifier === 'IA1' 
			&& typeof saleData[ info.parent_Identifier ] !== 'undefined' ){

			if ( info.price !== 0 ){

				// 데이터 초기화
				saleData[ info.parent_Identifier ].inApp = saleData[ info.parent_Identifier ].inApp || {};
				saleData[ info.parent_Identifier ].inApp[ info.sku ] = saleData[ info.parent_Identifier ].inApp[ info.sku ] || {};
				saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ] = saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ] || {};

				// 횟수, 금액 초기화 및 값 증가
				saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].chargedRefundCount = saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].chargedRefundCount || 0;
				saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].chargedRefundCount += 1;
				if( info.cnt > 0 ){
					saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].chargedCount = saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].chargedCount || 0;
					saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].chargedCount += 1;
				} else {
					saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].refundCount = saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].refundCount || 0;
					saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].refundCount += 1;
				}
				saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].money = saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].money || 0;
				saleData[ info.parent_Identifier ].inApp[ info.sku ][ info.currency ].money += info.price;
			}
		}
	}

	// console.log(JSON.stringify(saleData));

	saveReportToCSV(saleData);
};

var saveReportToCSV = function(saleData){
	var data = 'AppID,InAppID,Charged-Refund-Count,Charged,Refund,Currency,sum,install-Count\n';
	var installData = '';

	for( var appID in saleData ){
		// 앱을 구매하여 가격 정보를 가지고 있는 경우
		if( typeof saleData[ appID ].currency !== 'undefined' ){
			for( var currency in saleData[ appID ].currency ){
				data += appID + ',';
				data += ',';

				data += ( typeof saleData[ appID ].currency[ currency ].chargedRefundCount === 'undefined' || saleData[ appID ].currency[ currency ].chargedRefundCount === 0  ) ? ',' : saleData[ appID ].currency[ currency ].chargedRefundCount + ',';
				data += ( typeof saleData[ appID ].currency[ currency ].chargedCount === 'undefined' || saleData[ appID ].currency[ currency ].chargedCount === 0 ) ? ',' : saleData[ appID ].currency[ currency ].chargedCount + ',';
				data += ( typeof saleData[ appID ].currency[ currency ].refundCount === 'undefined' || saleData[ appID ].currency[ currency ].refundCount === 0 ) ? ',' : saleData[ appID ].currency[ currency ].refundCount + ',';

				data += currency + ',';
				data += saleData[ appID ].currency[ currency ].money + ',';
				data += '\n';
			}
		}
		// 토모키즈 앱에 대한 예외 처리
		else if( typeof saleData[ appID ].inApp !== 'undefined' && appID === 'TOMOKIDS_001') {
			for( var currency in saleData[ appID ].inApp ){
				for( var price in saleData[ appID ].inApp[currency] ){
					data += appID + ',';
					data += price + ',';

					data += ( typeof saleData[ appID ].inApp[ currency ][ price ].chargedRefundCount === 'undefined' || saleData[ appID ].inApp[ currency ][ price ].chargedRefundCount === 0  ) ? ',' : saleData[ appID ].inApp[ currency ][ price ].chargedRefundCount + ',';
					data += ( typeof saleData[ appID ].inApp[ currency ][ price ].chargedCount === 'undefined' || saleData[ appID ].inApp[ currency ][ price ].chargedCount === 0 ) ? ',' : saleData[ appID ].inApp[ currency ][ price ].chargedCount + ',';
					data += ( typeof saleData[ appID ].inApp[ currency ][ price ].refundCount === 'undefined' || saleData[ appID ].inApp[ currency ][ price ].refundCount === 0 ) ? ',' : saleData[ appID ].inApp[ currency ][ price ].refundCount + ',';

					data += currency + ',';
					data += saleData[ appID ].inApp[ currency ][ price ].money + ',';
					data += '\n';
				}
			}
		}
		// 인앱을 구매하여 가격정보를 가지고 있는 경우
		else if( typeof saleData[ appID ].inApp !== 'undefined' ){
			for( var inAppID in saleData[ appID ].inApp ){
				for( var currency in saleData[ appID ].inApp[ inAppID ] ){
					data += appID + ',';
					data += inAppID + ',';

					data += ( typeof saleData[ appID ].inApp[ inAppID ][ currency ].chargedRefundCount === 'undefined' || saleData[ appID ].inApp[ inAppID ][ currency ].chargedRefundCount === 0  ) ? ',' : saleData[ appID ].inApp[ inAppID ][ currency ].chargedRefundCount + ',';
					data += ( typeof saleData[ appID ].inApp[ inAppID ][ currency ].chargedCount === 'undefined' || saleData[ appID ].inApp[ inAppID ][ currency ].chargedCount === 0 ) ? ',' : saleData[ appID ].inApp[ inAppID ][ currency ].chargedCount + ',';
					data += ( typeof saleData[ appID ].inApp[ inAppID ][ currency ].refundCount === 'undefined' || saleData[ appID ].inApp[ inAppID ][ currency ].refundCount === 0 ) ? ',' : saleData[ appID ].inApp[ inAppID ][ currency ].refundCount + ',';

					data += currency + ',';
					data += saleData[ appID ].inApp[ inAppID ][ currency ].money + ',';
					data += '\n';
				}
			}
		}
		// 앱을 설치한 정보를 가지고 있는 경우
		if( typeof saleData[ appID ].installCount !== 'undefined' ){
			installData += appID + ',,,,,,,';
			installData += saleData[ appID ].installCount;
			installData += '\n';
		}
	}

	data += '\n\n' + installData;

	// var fileName = __dirname + "/../../tomcat6.0.35/webapps/webdav/tomo/analytics/apple/" + yesterDayStr + '.csv';
	var fileName = "./output/" + yesterDayStr + '.csv';
	fs.writeFile( fileName, data, function(err) {
		if( err ){
			throw err;
			console.log(err);
		} else {
			console.log( "Create CSV File" );
		}
	});
}



var getYearMM = function(){
	var now = new Date();
	var yearMM = now.getFullYear() + '';
	var month = now.getMonth() + 1;
	month = ( month < 10 ? '0' : '' ) + month;
	yearMM = yearMM + month;
	return yearMM;
};


