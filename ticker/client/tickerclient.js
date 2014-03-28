Players = new Meteor.Collection("players");
systemStream = new Meteor.Stream('system');
System = new Meteor.Collection("system");

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

Template.game_screen.cash = function()
{
	return Players.findOne({"id": Meteor.userId()}).cash;
}

Template.game_screen.nett = function()
{
	return Players.findOne({"id": Meteor.userId()}).cash;
}

Template.game_screen.players = function()
{
	return Players.find({}, {sort:{"cash": -1}});
}

Meteor.startup(function () {
    $('body').attr('skin-black');
  });

Template.not_active.events({

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
			/* Not logged in */
			alert ("You are not logged in. Please log in and try again.");
			return;
		}
	}

});