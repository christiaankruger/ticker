Players = new Meteor.Collection("players");
systemStream = new Meteor.Stream('system');
System = new Meteor.Collection("system");

Template.check_active.isActive = function ()
{
	var active = System.findOne().active;
	if (!Meteor.userId()) {
		alert("A game is running, but log in to join.");
	}
	return active && Meteor.userId();
}

Template.not_active.events({

	'click input#join' : function (event) {
		event.preventDefault();
		if (Meteor.userId()) {
			/* User is logged in */
		} else {
			/* Not logged in */
			alert ("You are not logged in. Please log in and try again.");
			return;
		}
	}

});