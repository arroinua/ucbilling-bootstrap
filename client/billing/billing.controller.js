(function(){

	'use strict';

	angular
		.module('app.billing')
		.controller('BillingController', BillingController);

	BillingController.$inject = ['$translate', 'utilsService', 'apiService', 'moment', 'customerService', 'spinnerService', 'errorService'];

	function BillingController($translate, utilsService, api, moment, customerService, spinner, errorService) {

		var vm = this;
		// var transactions = [];

		vm.customer = customerService.getCustomer();
		vm.currentBalance = null;
		vm.transactions = [];
		vm.charges = [];
		vm.startBalance = '';
		vm.lastBillingDate = null;
		vm.startDate = moment().subtract(7, 'days').toDate();
		vm.endDate = moment().endOf('day').toDate();
		vm.dateFormat = 'dd MMMM yyyy';
		vm.startDateOptions = {
			// minDate: new Date(2010, 1, 1),
			// maxDate: new Date(vm.endDate),
			showWeeks: false
		};
		vm.endDateOptions = {
			minDate: new Date(vm.startDate),
			showWeeks: false
		};
		vm.parseDate = function(date){
			return utilsService.parseDate(date);
		};
		vm.sumUp = sumUp;
		vm.findRecords = findRecords;

		console.log('customer: ', vm.customer);

		spinner.show('main-spinner');

		getCustomerBalance();
		findRecords();

		function findRecords(){
			getTransactions();
		}

		function getTransactions() {
			api.request({
				url: "transactions",
				params: {
					start: Date.parse(vm.startDate),
					end: Date.parse(vm.endDate)
				}
			}).then(function(response){
				console.log('Transactions: ', response.data);
				vm.transactions = response.data.result;

				return api.request({
					url: "charges",
					params: {
						start: Date.parse(vm.startDate),
						end: Date.parse(vm.endDate)
					}
				});
			}).then(function(response) {
				console.log('Charges: ', response.data);
				vm.charges = response.data.result;
				vm.startBalance = vm.charges.length ? vm.charges[vm.charges.length-1].startBalance : null;
				vm.lastBillingDate = vm.charges.length ? vm.charges[0].to : null;
				vm.totalCharges = vm.charges.length ? (vm.startBalance - vm.customer.balance) : null;
				// vm.transactions = transactions;

				spinner.hide('main-spinner');
				console.log('Final: ', vm.transactions, vm.charges);
			}).catch(function(err) {
				spinner.hide('main-spinner');
				errorService.show(err);
			});
		}

		function getCustomerBalance() {
			api.request({
				url: "getCustomerBalance"
			}).then(function(response){
				vm.customer.balance = response.data.result;
				vm.currentBalance = stringToFixed(response.data.result);
				customerService.setCustomerBalance(response.data.result);
			}, function(err){
				spinner.hide('main-spinner');
				errorService.show(err);
			});
		}

		function stringToFixed(string) {
			return utilsService.stringToFixed(string, 2);
		}

		function sumUp(array) {
			var amount = 0;
			array.forEach(function(item){
				amount += parseFloat(item);
			});
			return amount;
		}

		// function getCharges() {
		// 	api.request({
		// 		url: "charges",
		// 		params: {
		// 			start: Date.parse(vm.startDate),
		// 			end: Date.parse(vm.endDate)
		// 		}
		// 	}).then(function(response){
		// 		console.log('Charges: ', response.data);
		// 		vm.charges = response.data.result;
		// 	}, function(err){
		// 		errorService.show(err);
		// 	});
		// }

	}

})();