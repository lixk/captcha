/*! Verify-v0.1.0 MIT License by 大熊*/


;(function($, window, document,undefined) {

    //定义Slide的构造函数
    var Slide = function(ele, opt) {
        this.$element = ele,
        this.defaults = {
        	type : 1,
        	mode : 'fixed',	//弹出式pop，固定fixed
            vSpace : 5,
            explain : '向右滑动完成验证',
            imageUrl : '',
            checkUrl : '',
            imageSize : {
	        	width: '300px',
	        	height: '150px',
	        },
	        blockSize : {
	        	width: '50px',
	        	height: '50px',
	        },
	        barSize : {
	        	width : '400px',
	        	height : '40px',
	        },
            ready : function(){},
        	success : function(){},
            error : function(){}
            
        },
        this.options = $.extend({}, this.defaults, opt)
    };
    
    
    //定义Slide的方法
    Slide.prototype = {
    	//从服务器获取验证码图片数据
        getImageData: function () {
            var params = {
                width: parseInt(this.options.imageSize.width), height: parseInt(this.options.imageSize.height),
                blockWidth: parseInt(this.options.blockSize.width), blockHeight: parseInt(this.options.blockSize.height)
            };
            var data = null;
            $.ajax({url: this.options.imageUrl,
                data: params,
                type: 'get',
                dataType: 'json',
                async: false,
                success: function (r) {
                    data = r;
                }});
            return data;
        },
        //服务器验证是否通过
        checkImageData: function (posX) {
        	var data = null;
            $.ajax({url: this.options.checkUrl,
				data: {posX: parseInt(posX)},
				type: 'post',
				dataType: 'json',
				async: false,
				success: function (r) {
                    data = r;
                }});
            return data;
        },
        //初始化
        init: function() {
        	var _this = this;
        	
        	//加载页面
        	var r = this.getImageData();
        	console.log(r);
			this.loadDom(r.data.image, r.data.block, r.data.top);
        	this.options.ready();

        	this.$element[0].onselectstart = document.body.ondrag = function(){
				return false; 
			};
        	
        	if(this.options.mode == 'pop')	{
        		this.$element.on('mouseover', function(e){
        			_this.showImg();
	        	});
	        	
	        	this.$element.on('mouseout', function(e){
	        		_this.hideImg();
	        	});
	        	
	        	
	        	this.htmlDoms.out_panel.on('mouseover', function(e){
	        		_this.showImg();
	        	});
	        	
	        	this.htmlDoms.out_panel.on('mouseout', function(e){
	        		_this.hideImg();
	        	});
        	}
        	
        	//按下
        	this.htmlDoms.move_block.on('touchstart', function(e) {
        		_this.start(e);
        	});
        	
        	this.htmlDoms.move_block.on('mousedown', function(e) {
        		_this.start(e);
        	});
        	
        	//拖动
            window.addEventListener("touchmove", function(e) {
            	_this.move(e);
            });
            window.addEventListener("mousemove", function(e) {
				
            	_this.move(e);
            });
            
            //鼠标松开
            window.addEventListener("touchend", function() {
            	_this.end();
            });
            window.addEventListener("mouseup", function() {
            	_this.end();
            });
            
            //刷新
            _this.$element.find('.verify-refresh').on('click', function() {
            	_this.refresh();
            });
        },
        
        //初始化加载
        loadDom : function(imageData, blockData, top) {
        	var panelHtml = '';
        	var tmpHtml = '';
        	
        	if(this.options.type != 1) {		//图片滑动
        		panelHtml += '<div class="verify-img-out"><div class="verify-img-panel"><div  class="verify-refresh"><i class="iconfont icon-refresh"></i></div></div></div>';
        		tmpHtml = '<div  class="verify-sub-block"></div>';
        	}
        	
        	panelHtml += '<div class="verify-bar-area"><span  class="verify-msg">'+this.options.explain+'</span><div class="verify-left-bar"><span  class="verify-msg"></span><div  class="verify-move-block"><i  class="verify-icon iconfont icon-right"></i>'+tmpHtml+'</div></div></div>';
        	this.$element.append(panelHtml);
        	
        	this.htmlDoms = {
        		sub_block : this.$element.find('.verify-sub-block'),
        		out_panel : this.$element.find('.verify-img-out'),
        		img_panel : this.$element.find('.verify-img-panel'),
        		bar_area : this.$element.find('.verify-bar-area'),
        		move_block : this.$element.find('.verify-move-block'),
        		left_bar : this.$element.find('.verify-left-bar'),
        		msg : this.$element.find('.verify-msg'),
        		icon : this.$element.find('.verify-icon'),
        		refresh :this.$element.find('.verify-refresh')
        	};
        	
        	this.status = false;	//鼠标状态
        	this.isEnd = false;		//是否验证完成
        	this.setSize = this.resetSize(this);	//重新设置宽度高度
        	
        	this.$element.css('position', 'relative');
        	if(this.options.mode == 'pop') {
        		this.htmlDoms.out_panel.css({'display': 'none', 'position': 'absolute', 'bottom': '42px'});
        		this.htmlDoms.sub_block.css({'display': 'none'});
        	}else {
        		this.htmlDoms.out_panel.css({'position': 'relative'});
        	}
        	
        	this.htmlDoms.sub_block.css({'width': this.options.blockSize.width, 'height': this.options.blockSize.height});
        	this.htmlDoms.out_panel.css('height', parseInt(this.setSize.img_height) + this.options.vSpace + 'px');
        	this.htmlDoms.img_panel.css({'width': this.setSize.img_width, 'height': this.setSize.img_height, 'background': 'url(' + imageData + ')', 'background-size' : this.setSize.img_width + ' '+ this.setSize.img_height});
        	this.htmlDoms.bar_area.css({'width': this.setSize.bar_width, 'height': this.options.barSize.height, 'line-height':this.options.barSize.height});
        	this.htmlDoms.move_block.css({'width': this.options.barSize.height, 'height': this.options.barSize.height});
        	this.htmlDoms.left_bar.css({'width': this.options.barSize.height, 'height': this.options.barSize.height});
        	
        	this.randSet(blockData, top);
        },
        
        //鼠标按下
        start: function(e) {
        	if(this.isEnd == false) {
	        	this.htmlDoms.msg.text('');
	        	this.htmlDoms.move_block.css('background-color', '#337ab7');
	        	this.htmlDoms.left_bar.css('border-color', '#337AB7');
	        	this.htmlDoms.icon.css('color', '#fff');
	        	e.stopPropagation();
	        	this.status = true;
        	}
        },
        
        //鼠标移动
        move: function(e) {
        	if(this.status && this.isEnd == false) {
				if(this.options.mode == 'pop')	{
        			this.showImg();
				}
        		
	            if(!e.touches) {    //兼容移动端
	                var x = e.clientX;
	            }else {     //兼容PC端
	                var x = e.touches[0].pageX;
	            }
	            var bar_area_left = Slide.prototype.getLeft(this.htmlDoms.bar_area[0]); 
	            var move_block_left = x - bar_area_left; //小方块相对于父元素的left值
	            
	            
	            if(this.options.type != 1) {		//图片滑动
	            	if(move_block_left >= this.htmlDoms.bar_area[0].offsetWidth - parseInt(parseInt(this.options.blockSize.width)/2) - 2) {
	                	move_block_left = this.htmlDoms.bar_area[0].offsetWidth - parseInt(parseInt(this.options.blockSize.width)/2) - 2;
	            	}
	            	
	            }else {		//普通滑动
	            	if(move_block_left >= this.htmlDoms.bar_area[0].offsetWidth - parseInt(parseInt(this.options.barSize.height)/2) + 3) {
	            		this.$element.find('.verify-msg:eq(1)').text('松开验证');
	                	move_block_left = this.htmlDoms.bar_area[0].offsetWidth - parseInt(parseInt(this.options.barSize.height)/2) + 3;
	            	}else {
	            		this.$element.find('.verify-msg:eq(1)').text('');
	            	}
	            }
	            
	            
	            if(move_block_left <= 0) {
            		move_block_left = parseInt(parseInt(this.options.blockSize.width)/2);
            	}
	            
	            //拖动后小方块的left值
	            this.htmlDoms.move_block.css('left', move_block_left-parseInt(parseInt(this.options.blockSize.width)/2) + "px");
	            this.htmlDoms.left_bar.css('width', move_block_left-parseInt(parseInt(this.options.blockSize.width)/2) + "px");
	        }
        },
        
        //鼠标松开
        end: function() {
        	
        	var _this = this;
        	
        	//判断是否重合
        	if(this.status  && this.isEnd == false) {
                var result = this.checkImageData(this.htmlDoms.move_block.css('left'));
                console.log(result);
        		if(this.options.type != 1) {		//图片滑动
        			
		            if(result.code == 200) {
		            	this.htmlDoms.move_block.css('background-color', '#5cb85c');
		            	this.htmlDoms.left_bar.css({'border-color': '#5cb85c', 'background-color': '#fff'});
		            	this.htmlDoms.icon.css('color', '#fff');
		            	this.htmlDoms.icon.removeClass('icon-right');
		            	this.htmlDoms.icon.addClass('icon-check');
		            	this.htmlDoms.refresh.hide();
		            	this.isEnd = true;
		            	this.options.success(this);
		            }else{
		            	this.htmlDoms.move_block.css('background-color', '#d9534f');
		            	this.htmlDoms.left_bar.css('border-color', '#d9534f');
		            	this.htmlDoms.icon.css('color', '#fff');
		            	this.htmlDoms.icon.removeClass('icon-right');
		            	this.htmlDoms.icon.addClass('icon-close');
		            	
		            	
		            	setTimeout(function () { 
					    	_this.refresh();
					    }, 400);
		            	
		            	this.options.error(this);
		            }
        			
        		}else {		//普通滑动

                    if(result.code == 200) {
                        this.htmlDoms.move_block.css('background-color', '#5cb85c');
        				this.htmlDoms.left_bar.css({'color': '#4cae4c', 'border-color': '#5cb85c', 'background-color': '#fff' });
        				this.htmlDoms.icon.css('color', '#fff');
		            	this.htmlDoms.icon.removeClass('icon-right');
		            	this.htmlDoms.icon.addClass('icon-check');
		            	this.htmlDoms.refresh.hide();
        				this.$element.find('.verify-msg:eq(1)').text('验证成功');
        				this.isEnd = true;
        				this.options.success(this);
        			}else {
        				this.$element.find('.verify-msg:eq(1)').text('');
        				this.htmlDoms.move_block.css('background-color', '#d9534f');
		            	this.htmlDoms.left_bar.css('border-color', '#d9534f');
		            	this.htmlDoms.icon.css('color', '#fff');
		            	this.htmlDoms.icon.removeClass('icon-right');
		            	this.htmlDoms.icon.addClass('icon-close');
		            	this.isEnd = true;
		            	
		            	setTimeout(function () { 
		            		_this.$element.find('.verify-msg:eq(1)').text('');
					    	_this.refresh();
					    	_this.isEnd = false;
					    }, 400);
		            	
		            	this.options.error(this);
        			}
        		}
        		
	            this.status = false;
        	}
        },
        
        //弹出式
        showImg : function() {
        	this.htmlDoms.out_panel.css({'display': 'block'});
        	this.htmlDoms.sub_block.css({'display': 'block'});
        },
        
        //固定式
        hideImg : function() {
        	this.htmlDoms.out_panel.css({'display': 'none'});
        	this.htmlDoms.sub_block.css({'display': 'none'});
        },
        
        
        resetSize : function(obj) {
        	var img_width,img_height,bar_width,bar_height;	//图片的宽度、高度，移动条的宽度、高度
        	var parentWidth = obj.$element.parent().width() || $(window).width();
        	var parentHeight = obj.$element.parent().height() || $(window).height();
        	
       		if(obj.options.imageSize.width.indexOf('%')!= -1){
        		img_width = parseInt(obj.options.imageSize.width)/100 * parentWidth + 'px';
		　　}else {
				img_width = obj.options.imageSize.width;
			}
		
			if(obj.options.imageSize.height.indexOf('%')!= -1){
        		img_height = parseInt(obj.options.imageSize.height)/100 * parentHeight + 'px';
		　　}else {
				img_height = obj.options.imageSize.height;
			}
		
			if(obj.options.barSize.width.indexOf('%')!= -1){
        		bar_width = parseInt(obj.options.barSize.width)/100 * parentWidth + 'px';
		　　}else {
				bar_width = obj.options.barSize.width;
			}
		
			if(obj.options.barSize.height.indexOf('%')!= -1){
        		bar_height = parseInt(obj.options.barSize.height)/100 * parentHeight + 'px';
		　　}else {
				bar_height = obj.options.barSize.height;
			}
		
			return {img_width : img_width, img_height : img_height, bar_width : bar_width, bar_height : bar_height};
       	},
        
        //随机出生点位
        randSet: function(blockData, top) {
          	this.$element.find('.verify-sub-block').css({'top':'-'+(parseInt(this.setSize.img_height)- top + this.options.vSpace)+'px', 'background-image': 'url('+ blockData +')'});
        },
        
        //刷新
        refresh: function() {
        	this.htmlDoms.refresh.show();
        	this.$element.find('.verify-msg:eq(1)').text('');
        	this.$element.find('.verify-msg:eq(1)').css('color', '#000');
        	this.htmlDoms.move_block.animate({'left':'0px'}, 'fast');
			this.htmlDoms.left_bar.animate({'width': '40px'}, 'fast');
			this.htmlDoms.left_bar.css({'border-color': '#ddd'});
			
			this.htmlDoms.move_block.css('background-color', '#fff');
			this.htmlDoms.icon.css('color', '#000');
			this.htmlDoms.icon.removeClass('icon-close');
			this.htmlDoms.icon.addClass('icon-right');
			this.$element.find('.verify-msg:eq(0)').text(this.options.explain);

			var r = this.getImageData();
			var imageData = r.data.image;
			var blockData = r.data.block;
			var top = r.data.top;
        	this.randSet(blockData, top);
            this.$element.find('.verify-img-panel').css({'background': 'url('+ imageData +')', 'background-size': this.setSize.img_width + ' '+ this.setSize.img_height});
            this.$element.find('.verify-sub-block').css({'background-image': 'url('+ blockData +')'});
        	
        	this.isEnd = false;
        },
        
        //获取left值
        getLeft: function(node) {
			var left = $(node).offset().left;
            return left;
        }
    };
    
    //在插件中使用slideVerify对象
    $.fn.slideVerify = function(options, callbacks) {
        var slide = new Slide(this, options);
        slide.init();
    };

})(jQuery, window, document);
