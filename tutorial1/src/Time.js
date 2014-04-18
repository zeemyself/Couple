var Time = cc.Sprite.extend({
	ctor : function (){

		this._super();
		this.timeNumber = 20;
		this.textTime = "Time left : " + this.timeNumber;
		
		this.labelNumber = cc.LabelTTF.create(this.textTime, "Arial" , 72);
        this.labelNumber.setColor ( cc.c3 ( 64,64,64 ) );
        this.labelNumber.setPosition ( 540 , 670 );

        this.scheduleUpdate();
        
	},
	update : function (){
		
		
	}
})