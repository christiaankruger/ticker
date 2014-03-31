 Players = new Meteor.Collection("players");
 System = new Meteor.Collection("system");
 systemStream = new Meteor.Stream('system');
 Goods = new Meteor.Collection("goods");
 Factories = new Meteor.Collection("factories");
 Upgrades = new Meteor.Collection("upgrades");

 var goods = [
	{"name" : "Toys", "price" : 5.00},
	{"name" : "Paper", "price" : 5.00},
	{"name" : "Kryptonite", "price" : 5.00},
	{"name" : "Gold", "price" : 5.00},
	{"name" : "Silver", "price" : 5.00}
];

var upgrades = [
"Hire a monkey", "Hire another monkey", "Hire a manager", "Upgrade computer system",
"Move to a new site", "Buy a few trucks", "Ignore child labour laws"];

var MAX_RANGE = 0.5;

var starting_cash = 20000.00;
var start_units = 3;
var in_play = false;
var start_expense = 1.50;
var buy_price_factor = 2000;

 Meteor.startup(function () {
    if (!System.findOne()) {
      System.insert({"active": false});
    }
    else if (System.findOne().active) {
      in_play = true;
  	}
    set_ticks();

    if (Upgrades.findOne()) Upgrades._dropCollection();
    for (var i = 0; i < upgrades.length; i++) {

      var level = (i + 2);
      var text = upgrades[i];

      var cost = upgrade_cost (level);
      var units = level * level;

      Upgrades.insert({"text": text, "level" : level, "cost": cost, "units" : units});
    }

    var text = "Increase storage even more";

    for (var i = upgrades.length; i <= 100; i++) {
      var level = (i + 2);
      var cost = upgrade_cost(level);
      var units = level * level;
      Upgrades.insert({"text": text, "level" : level, "cost": cost, "units" : units});
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

 /* For p = 1 */
 function upgrade_cost (k)
 {
      return 500.0 * (1 + k/(15-k)) * Math.pow(k, 1.5) * (1/(15-k));
 }

function start_server() {

  System._dropCollection();
   in_play = true;
   System.insert({"active": true});
}

function set_ticks()
{
	Meteor.setInterval(function()
      {
         if (!System.findOne()) return;
         if(System.findOne().active == false || !in_play) return;
      	 console.log("Tick");
      	 sales_tick();
         goods_document_tick();
      }, 1000);
	Meteor.setInterval(function()
	{
    if (!System.findOne()) return;
    if(System.findOne().active == false|| !in_play) return;
		price_tick();
	}, 3000);


}

function goods_document_tick()
{ 
    var goods_cursor = Goods.find();
    var goods = goods_cursor.fetch();
    for (var i = 0; i < goods.length; i++) {
      var good = goods[i];
      var price = good.price;
      Goods.update({"_id": good._id}, {$push: {history: price}});
    }
}

function reset_server()
{
  in_play = false;
  if (Goods.findOne()) Goods._dropCollection();
  for (var i = 0; i < goods.length; i++) {
        var g = goods[i];
        var new_cost = g.price * buy_price_factor;
        Goods.insert({"new_cost": new_cost, "name": g.name, "price": g.price, "custom_id": i});
  }
	System.update({"active" : true}, {"active": false});
	if (Players.findOne()) Players._dropCollection();
	if (Factories.findOne()) Factories._dropCollection();
}

 Meteor.methods({

 	add_player: function(userId, name) {
    if (Players.find({"id": userId}).count() != 0) return true;
 		
    Players.insert({"id": userId, "name": name, "cash": starting_cash});

 		var goods_cursor = Goods.find();
 		var goods = goods_cursor.fetch();
 		for (var i = 0; i < goods.length; i++) {
 			var good = goods[i];
      var new_cost = good.price * buy_price_factor;
 			Factories.insert({"level": 1, "goods_id": good.custom_id, "owner": userId, "units": 0, "value": 0.00, "expense": start_expense});
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

 		Players.update({"id": userId}, {$inc: {"cash": -1*cost}});

 		return true;

 	},

  upgrade_factory: function (userId, goodId)
  {
      console.log("userId = " + userId);
      console.log("goodId = " + goodId);

      var factory = find_factory(userId, goodId);
      var new_level = factory.level + 1;
      var upgrade = Upgrades.findOne({"level": new_level});
      var good = find_good(goodId);
      var cash = Players.findOne({"id": userId}).cash;

      var upgrade_cost = upgrade.cost * good.price;

      if (cash < upgrade_cost) return false;

      Players.update({"id": userId}, {$inc: {"cash": -1*upgrade_cost}});

      var units = upgrade.units;
      var value = factory.value + upgrade_cost;
      var expenses_per_second = factory.expenses_per_second;

      if (new_level % 4 == 0) {
          expenses_per_second += 0.5;
      }

      Factories.update({"_id" : factory._id}, {$set: {"level": new_level, "units": units, "value": value, "expenses_per_second": expenses_per_second}});
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

 function find_factory(userId, goodId)
 {
    var factories_curr = Factories.find({"owner": userId});
    var factories = factories_curr.fetch();
    for (var i = 0; i < factories.length; i++) {
      var factory = factories[i];
      if (factory.goods_id == goodId) return factory;
    }
    return null;
 }

 function find_good (goodId)
 {
    var goods_cursor = Goods.find();
    var goods = goods_cursor.fetch();
    for (var i = 0; i < goods.length; i++) {
      if (goods[i].custom_id == goodId) return goods[i];
    }
    return null;
 }

 function sales_tick()
 {

 		var players_cursor = Players.find();
 		var players = players_cursor.fetch();
 		for (var i = 0; i < players.length; i++) {
 			
      player = players[i];
 			var id = player.id;
      var sales_per_second = 0.0;
      var expenses_per_second = 0.0;

 			var cash = player.cash;
 			var factories_cursor = Factories.find({"owner": id});
 			var factories = factories_cursor.fetch();
 			for (var j = 0; j < factories.length; j++) {
 				var factory = factories[j];
 				var good = Goods.findOne({"custom_id": factory.goods_id});
 				cash += factory.units * (good.price - factory.expense);

 				sales_per_second += factory.units * good.price;
        expenses_per_second += factory.units * factory.expense;
 			}
 			Players.update({"id": id}, {$set: {"cash": cash, "sales_per_second" : sales_per_second, "expenses_per_second": expenses_per_second}});
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
 	Goods.update({"custom_id": id}, {$set: {"new_cost": curr_price * buy_price_factor}});
 }

 function pretty_number (value)
 {
 	value = value.toFixed(2);
 	return parseFloat(value);
 }