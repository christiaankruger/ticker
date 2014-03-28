 Players = new Meteor.Collection("players");
 System = new Meteor.Collection("system");
 systemStream = new Meteor.Stream('system');
 Goods = new Meteor.Collection("goods");

 var goods = [
	{"name" : "Toys", "price" : 5.00},
	{"name" : "Paper", "price" : 5.00},
	{"name" : "Kryptonite", "price" : 5.00},
	{"name" : "Gold", "price" : 5.00},
	{"name" : "Silver", "price" : 5.00}
];

var MAX_RANGE = 0.5;

var starting_cash = 100.00;

 Meteor.startup(function () {
    if (!System.findOne()) {
      System.insert({"active": false});
    }
    if (System.findOne().active) {
    	Meteor.setInterval(function()
      {
      	 console.log("Tick");
      	 tick();
      }, 1000);
    }
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

      
    	start_server();


      this.response.writeHead(200, {'Content-Type': 'text/html'});
      this.response.end("success");
    }
  });

});

function start_server() {
	 System._dropCollection();
	 Goods._dropCollection();
      System.insert({"active": true});
      for (var i = 0; i < goods.length; i++) {
      	var g = goods[i];
      	Goods.insert({"name": g.name, "price": g.price, "custom_id": i});
      }
      Meteor.setInterval(function()
      {
      	 console.log("Tick");
      	 tick();
      }, 1000);
}

function reset_server()
{
	System.update({"active" : true}, {"active": false});
}

 Meteor.methods({

 	add_player: function(userId, name) {
    if (Players.find({"id": userId}).count() != 0) return true;
 		Players.insert({"id": userId, "name": name, "cash": starting_cash});
 		console.log("Added " + name + " to the game.");
 		return true;
 	}

 });

 function tick()
 {
 		var marked = [];
 		var indicies = [];
 		for (var i = 0; i < goods.length; i++) {
 			marked.push(false);
 		}
 		do {
 			var index_s = (Math.random() * goods.length).toFixed(0);
 			var index = parseInt(index_s);
 			if (index == goods.length) index--;
 			if (!marked[index]) {
 				indicies.push(index);
 				marked[index] = true;
 			}
 		} while (indicies.length != 2);

 		for (var i = 0; i < indicies.length; i++) {
 			var change = (Math.random() * MAX_RANGE * 2).toFixed(2) - MAX_RANGE;

 			var index = indicies[i];

 			console.log("indicies[i] = " + indicies[i]);
 			alter_price (index, change);

 		}
 }

 function alter_price (id, amount)
 {
 	id = parseInt(id);
 	var cursor = Goods.findOne({"custom_id": id});
 	var curr_price = cursor.price;
 	curr_price += amount;
 	curr_price = pretty_number(curr_price);
 	if (curr_price <= 0) curr_price = 0.01;
 	Goods.update({"custom_id": id}, {$set: {"price": curr_price}});
 }

 function pretty_number (value)
 {
 	value = value.toFixed(2);
 	return parseFloat(value);
 }



