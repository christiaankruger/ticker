Players = new Meteor.Collection("players");
systemStream = new Meteor.Stream('system');
System = new Meteor.Collection("system");
Goods = new Meteor.Collection("goods");
Factories = new Meteor.Collection("factories");

function buy (goods_id)
{
	console.log("Going to buy a factory");

	Meteor.call("buy_factory", Meteor.userId(), goods_id, function (err, success) {
		if (success) {
			alert("Success");
		}	
	});

}

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

Template.dashboard.cash = function()
{
	return Players.findOne({"id": Meteor.userId()}).cash;
}

Template.dashboard.nett = function()
{
	return Players.findOne({"id": Meteor.userId()}).cash;
}

Template.game_screen.players = function()
{
	return Players.find({}, {sort:{"cash": -1}});
}

Template.dashboard.goods = function()
{
	return Goods.find();
}

Template.facts.factories = function()
{
	var to_return = [];
	var fact_cursor = Factories.find({"owner": Meteor.userId()});
	var facts = fact_cursor.fetch();
	for (var i = 0; i < facts.length; i++) {
		var goods_id = facts[i].goods_id;
		var good_name = Goods.findOne({"custom_id" : goods_id}).name;

		var new_cost = Goods.findOne({"custom_id" : goods_id}).new_cost;

		var units = facts[i].units;
		var value = facts[i].value.toFixed(2);
		var has_one = units != 0;
		to_return.push({"goods_id": goods_id, "goods": good_name, "units": units, "value": value, "has_one": has_one, "new_cost" : new_cost});
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
