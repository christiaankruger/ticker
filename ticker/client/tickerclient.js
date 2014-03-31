Players = new Meteor.Collection("players");
systemStream = new Meteor.Stream('system');
System = new Meteor.Collection("system");
Goods = new Meteor.Collection("goods");
Factories = new Meteor.Collection("factories");
Upgrades = new Meteor.Collection("upgrades");

var colors = ["blue", "black", "orange", "red", "green"];
var charts = [];
var lines = [];
var isActive = false;
var charts_active = false;

Template.main.isActive = function ()
{
	if (!System.findOne()) return false;
	var active = System.findOne().active;
	if (!Meteor.userId()) {
		alert("A game is running, but log in to join.");
	}

	var game_on = active && Meteor.userId();

	if (!charts_active) {
		Meteor.setInterval(function()
		{
			update_charts();
		}, 1000);
		charts_active = true;
	}

	return game_on;
}

Template.not_active.game_status = function ()
{
	if (!System.findOne()) return "starting soon.";
	if (!System.findOne().active) return "starting soon.";
	return "in play.";
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

Template.dashboard.e_p_s = function()
{
	var eps = Players.findOne({"id": Meteor.userId()}).expenses_per_second;
	return numeral(eps).format('0,0.00');
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
		var id = good.custom_id.toString();

		var price = numeral(good.price).format('0,0.00');

		to_return.push({"id": id, "name": name, "price": price});
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
		var good_cost = Goods.findOne({"custom_id": goods_id}).price;

		var new_cost = Goods.findOne({"custom_id" : goods_id}).new_cost;
		new_cost = numeral(new_cost).format('0,0.00');

		var units = facts[i].units;
		var value = numeral(facts[i].value).format('0,0.00');
		var has_one = units != 0;

		var single_e_p_s = facts[i].expense;
		var e_p_s = single_e_p_s * units;
		e_p_s = numeral(e_p_s).format('0,0.00');

		var level = facts[i].level;
		var upgrade = Upgrades.findOne({"level": level+1});

		var up_cost, up_text, up_units;

		if (upgrade != null) {

			up_cost = numeral(upgrade.cost * good_cost).format('0,0.00');
			up_text = upgrade.text;
			up_units = upgrade.units;
		} else {
			up_cost = numeral(upgrade.cost * good_cost).format('0,0.00');
			up_text = "Make this bigger!";
			up_units = (level + 1) * (level + 1);
		}
		to_return.push({"level": level, "up_units": up_units, "up_cost": up_cost, "up_text": up_text, "e_p_s": e_p_s, "color": color, "goods_id": goods_id, "goods": good_name, "units": units, "value": value, "has_one": has_one, "new_cost" : new_cost});
	}
	return to_return;
}	


Meteor.startup(function () {



  });

function update_charts()
{
	var goods_cursor = Goods.find();
	var goods = goods_cursor.fetch();
	for (var i = 0; i < goods.length; i++) {
		
		if (charts.length < goods.length) {
			charts.push(new SmoothieChart({maxValueScale:1.2, minValue:0, millisPerPixel:92}));
			charts[i].streamTo(document.getElementById("chart-" + goods[i].custom_id), 1000);
			lines[i] = new TimeSeries();
			charts[i].addTimeSeries(lines[i], {lineWidth:2,strokeStyle:'#00ff00'});
		}
		lines[i].append(new Date().getTime(), goods[i].price);
	}
}

 Template.not_active.events({

	'click #joinBtn' : function (event) {
		event.preventDefault();
		if (Meteor.userId()) {
			Meteor.call("add_player", Meteor.userId(), Meteor.user().profile.name,
				function(err, success) {
					if (success) {
						$("#main").html("Waiting for the game to start.");
						$("#small").html("Hang tight.");
					}
				});
		} else {
			/* Not logged in */
			alert ("You are not logged in. Please log in and try again.");
			return;
		}
	}



});


Template.factory.events({
		'click .buy' : function (event) {
		event.preventDefault();
		var good = event.currentTarget.id;
		Meteor.call("buy_factory", Meteor.userId(), good, function (err, success) {

		});
		
	},

	'click .upgrade': function (event)
	{
		event.preventDefault();
		var good = event.currentTarget.id;
		Meteor.call("upgrade_factory", Meteor.userId(), good, function (err, success) {

		});
	}
});
