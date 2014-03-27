 Players = new Meteor.Collection("players");
 System = new Meteor.Collection("system");
 systemStream = new Meteor.Stream('system');


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


function reset_server()
{
	System.update({"active" : true}, {"active": false});
}
