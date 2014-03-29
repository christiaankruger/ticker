Players = new Meteor.Collection("players");
systemStream = new Meteor.Stream('system');
System = new Meteor.Collection("system");
Goods = new Meteor.Collection("goods");
Factories = new Meteor.Collection("factories");

var colors = ["blue", "black", "orange", "red", "green"];

Template.main.isActive = function ()
{
	if (!System.findOne()) return false;
	var active = System.findOne().active;
	if (!Meteor.userId()) {
		alert("A game is running, but log in to join.");
	}
	return active && Meteor.userId();
}

Template.main.user_name = function()
{
	if (!Meteor.user()) return;
	return Meteor.user().profile.name;
}

Template.main.status = function()
{
	if (!System.findOne()) return "Server offline.";
	if (System.findOne().active) return "Server online.";
	return "Server offline.";
}

Template.dashboard.s_p_s = function()
{
	var sps = Players.findOne({"id": Meteor.userId()}).sales_per_second;
	return numeral(sps).format('0,0.00');
}

Template.dashboard.cash = function()
{
	var cash = Players.findOne({"id": Meteor.userId()}).cash;
	return numeral(cash).format('0,0.00');
}

Template.dashboard.nett = function()
{
	var cash = Players.findOne({"id": Meteor.userId()}).cash;
	var fact_value = 0;
	var fact_cursor = Factories.find({"owner": Meteor.userId()});
	var facts = fact_cursor.fetch();
	for (var i = 0; i < facts.length; i++) {
		fact_value += facts[i].value;
	}	
	var total = cash + fact_value;
	return numeral(total).format('0,0.00');
}

Template.game_screen.players = function()
{
	return Players.find({}, {sort:{"cash": -1}});
}

Template.dashboard.goods = function()
{
	var to_return = [];

	var goods_cursor = Goods.find();
	var goods = goods_cursor.fetch();
	for (var i = 0; i < goods.length; i++)
	{
		var good = goods[i];
		var name = good.name;
		var price = numeral(good.price).format('0,0.00');
		to_return.push({"name": name, "price": price});
	}
	return to_return;
}

Template.facts.factories = function()
{
	var to_return = [];
	var fact_cursor = Factories.find({"owner": Meteor.userId()});
	var facts = fact_cursor.fetch();
	for (var i = 0; i < facts.length; i++) {
		var goods_id = facts[i].goods_id;
		var color = colors[parseInt(goods_id) % colors.length];
		var good_name = Goods.findOne({"custom_id" : goods_id}).name;

		var new_cost = Goods.findOne({"custom_id" : goods_id}).new_cost;

		var units = facts[i].units;
		var value = numeral(facts[i].value).format('0,0.00');
		var has_one = units != 0;
		to_return.push({"color": color, "goods_id": goods_id, "goods": good_name, "units": units, "value": value, "has_one": has_one, "new_cost" : new_cost});
	}
	return to_return;
}	


Meteor.startup(function () {
    $('body').attr('skin-black');
  });

/* Template.not_active.events({

	'click input#join' : function (event) {
		event.preventDefault();
		if (Meteor.userId()) {
			Meteor.call("add_player", Meteor.userId(), Meteor.user().profile.name,
				function(err, success) {
					if (success) {
						$("#notice").html("<h4>You are signed up. Waiting for server.</h4>");
					}
				});
		} else {
			/* Not logged in 
			alert ("You are not logged in. Please log in and try again.");
			return;
		}
	}



}); */


Template.factory.events({
		'click .buy' : function (event) {
		event.preventDefault();
		var good = event.currentTarget.id;
		Meteor.call("buy_factory", Meteor.userId(), good, function (err, success) {

		});
		
	}
});
