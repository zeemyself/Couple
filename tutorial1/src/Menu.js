var Menu = cc.Node.extend({
	ctor : function () {
		var menuItem1 = new cc.MenuItemFont.create("Start Game",this,this.startGame());
		menuItem1.setPosition ( new cc.Point(size))
	}
});