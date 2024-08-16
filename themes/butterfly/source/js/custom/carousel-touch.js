var radius = 240, // 旋转木马的半径
    autoRotate = true, // 是否自动旋转
    rotateSpeed = -60, // 旋转速度
    imgWidth = 120, // 图片宽度
    imgHeight = 170; // 图片高度

function carouselinit(t) {
    setTimeout(init, 1000);
    var e = document.getElementById(t + "-drag-container");
    console.log(e);
    var n = document.getElementById(t + "-spin-container"),
        i = [...n.getElementsByTagName("img"), ...n.getElementsByTagName("video")];

    n.style.width = imgWidth + "px";
    n.style.height = imgHeight + "px";

    var a = document.getElementById(t + "-carousel-ground");

    function init(t) {
        for (var e = 0; e < i.length; e++) {
            i[e].style.transform = "rotateY(" + e * (360 / i.length) + "deg) translateZ(" + radius + "px)";
            i[e].style.transition = "transform 1s";
            i[e].style.transitionDelay = t || (i.length - e) / 4 + "s";

            // 手动添加点击事件来触发 Fancybox
            i[e].onclick = function () {
                // 手动初始化 Fancybox
                Fancybox.show([{ src: this.src, type: "image" }]);
            };
        }
    }

    function rotate(t) {
        m > 180 && (m = 180);
        m < 0 && (m = 0);
        t.style.transform = "rotateX(" + -m + "deg) rotateY(" + u + "deg)";
    }

    function toggleAnimation(t) {
        n.style.animationPlayState = t ? "running" : "paused";
    }

    a.style.width = 3 * radius + "px";
    a.style.height = 3 * radius + "px";

    var s = 0, d = 0, u = 0, m = 10;

    if (autoRotate) {
        var g = rotateSpeed > 0 ? "spin" : "spinRevert";
        n.style.animation = `${g} ${Math.abs(rotateSpeed)}s infinite linear`;
    }

    document.getElementById(t).onpointerdown = function (t) {
        clearInterval(e.timer);
        var n = (t = t || window.event).clientX, i = t.clientY;
        return this.onpointermove = function (t) {
            var a = (t = t || window.event).clientX, o = t.clientY;
            u += .1 * (s = a - n), m += .1 * (d = o - i), rotate(e), n = a, i = o;
        }, this.onpointerup = function (t) {
            e.timer = setInterval((function () {
                u += .1 * (s *= .95), m += .1 * (d *= .95), rotate(e), toggleAnimation(!1),
                Math.abs(s) < .5 && Math.abs(d) < .5 && (clearInterval(e.timer), toggleAnimation(!0))
            }), 17), this.onpointermove = this.onpointerup = null;
        }, !1
    };

    document.getElementById(t).onmousewheel = function (t) {
        var e = (t = t || window.event).wheelDelta / 20 || -t.detail;
        return radius += e, init(1), !1
    }
}
