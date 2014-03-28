 Players = new Meteor.Collection("players");
 System = new Meteor.Collection("system");
 systemStream = new Meteor.Stream('system');

 var goods = [
	{"name" : "Toys", "price" : "5.00"},
	{"name" : "Paper", "price" : "5.00"},
	{"name" : "Kryptonite", "price" : "5.00"},
	{"name" : "Gold", "price" : "5.00"},
	{"name" : "Silver", "price" : "5.00"}
];

var starting_cash = 100.00;

 Meteor.startup(function () {
    
  });

 Router.map(function () {
  this.route('reset-server', {
    where: 'server',
    path: '/server/reset',

    action: function () {

      reset_server();	

      this.response.writeHead(200, {'Content-Type': 'text/html'});
      this.response.end("success");
    }
  });


this.route('start-server', {
    where: 'server',
    path: '/server/start',

    action: function () {
      System.update({"active" : false}, {"active": true});
      this.response.writeHead(200, {'Content-Type': 'text/html'});
      this.response.end("success");
    }
  });

});

 Meteor.methods({

 	add_player: function(userId, name) {
 		Players.insert({"id": userId, "name": name, "cash": starting_cash});
 		console.log("Added " + name + " to the game.");
 		return true;
 	}

 });


function reset_server()
{
	System.update({"active" : true}, {"active": false});
}
