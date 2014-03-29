 Players = new Meteor.Collection("players");
 System = new Meteor.Collection("system");
 systemStream = new Meteor.Stream('system');
 Goods = new Meteor.Collection("goods");
 Factories = new Meteor.Collection("factories");

 var goods = [
	{"name" : "Toys", "price" : 5.00},
	{"name" : "Paper", "price" : 5.00},
	{"name" : "Kryptonite", "price" : 5.00},
	{"name" : "Gold", "price" : 5.00},
	{"name" : "Silver", "price" : 5.00}
];

var MAX_RANGE = 0.5;

var starting_cash = 10000.00;
var start_units = 5;

 Meteor.startup(function () {
    if (!System.findOne()) {
      System.insert({"active": false});
    }
    if (System.findOne().active) {
    	set_ticks();
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
      set_ticks();
      
}

function set_ticks()
{
	Meteor.setInterval(function()
      {
      	 console.log("Tick");
      	 sales_tick();
      }, 1000);
	Meteor.setInterval(function()
	{
		price_tick();
	}, 3000);
}

function reset_server()
{
	System.update({"active" : true}, {"active": false});
	Players._dropCollection();
	Factories._dropCollection();
}

 Meteor.methods({

 	add_player: function(userId, name) {
    if (Players.find({"id": userId}).count() != 0) return true;
 		Players.insert({"id": userId, "name": name, "cash": starting_cash});

 		var goods_cursor = Goods.find();
 		var goods = goods_cursor.fetch();
 		for (var i = 0; i < goods.length; i++) {
 			var good = goods[i];
 			Factories.insert({"goods_id": good.custom_id, "owner": userId, "units": 0, "value": 0.00});
 		}

 		console.log("Added " + name + " to the game.");
 		return true;
 	},

 	buy_factory: function (userId, good)
 	{
 		good = parseInt(good);
 		console.log("good = " + good);
 		var cost = Goods.findOne({"custom_id": good}).new_cost;
 		var money = Players.findOne({"id": userId}).cash;

 		if (money < cost) return false;

 		console.log("cost = " + cost);
 		console.log("money = " + money);

 		Factories.update({"owner": userId, "goods_id": good}, {$set: {"units": start_units, "value" : cost}});

 		money -= cost;

 		Players.update({"id": userId}, {$set: {"cash": money}});

 		return true;

 	}

 });

 function price_tick()
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

 			alter_price (index, change);

 		}
 }

 function sales_tick()
 {
 		var sales_per_second = 0.0;
 		var players_cursor = Players.find();
 		var players = players_cursor.fetch();
 		for (var i = 0; i < players.length; i++) {
 			player = players[i];
 			var id = player.id;
 			var cash = player.cash;
 			var factories_cursor = Factories.find({"owner": id});
 			var factories = factories_cursor.fetch();
 			for (var j = 0; j < factories.length; j++) {
 				var factory = factories[j];
 				var good = Goods.findOne({"custom_id": factory.goods_id});
 				cash += factory.units * good.price;
 				sales_per_second += factory.units * good.price;

 			}
 			pretty_number(cash);
 			Players.update({"id": id}, {$set: {"cash": cash, "sales_per_second" : sales_per_second}});
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
 	Goods.update({"custom_id": id}, {$set: {"new_cost": curr_price * 2000}});
 }

 function pretty_number (value)
 {
 	value = value.toFixed(2);
 	return parseFloat(value);
 }