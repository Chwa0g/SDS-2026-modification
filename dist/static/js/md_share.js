/**
 * md_share.js - 삼성SDS 공유하기 팝업 모듈 (Samsung SDS Event Share Popup Module)
 * 
 * 기존 운영 사이트(https://www.samsungsds.com/kr/event/index.html)에서
 * 여러 파일에 분산되어 있던 md_share 팝업 관련 기능을 하나의 독자적 모듈로 통합 정리함.
 */

(function (global, $) {
    'use strict';

    // 다국어 텍스트 기본값 (langSet 미정의 시 픽스 fallback)
    if (typeof global.langSet === 'undefined') {
        global.langSet = {
            ko: {
                openWindow: "새창열림",
                share: {
                    shareOpen: "공유하기 팝업 열림",
                    shareClose: "공유하기 팝업 닫힘"
                },
                layerPop: {
                    layerOpen: "레이어 팝업 열림"
                }
            },
            en: {
                openWindow: "Open in new window",
                share: {
                    shareOpen: "Share popup open",
                    shareClose: "Share popup close"
                },
                layerPop: {
                    layerOpen: "Layer popup open"
                }
            }
        };
    }

    let lastActivatedButton = null; // 마지막으로 활성화된 버튼 저장

    /**
     * 포커스 트랩 활성화 (웹 접근성)
     */
    function focusTrapOn($mdShareBtn) {
        if ($mdShareBtn && $mdShareBtn.length) {
            $mdShareBtn.find('a:visible, button:visible').first().focus();
        }
    }

    /**
     * 포커스 트랩 해제 및 포커스 복원 (웹 접근성)
     */
    function focusTrapOff() {
        if (lastActivatedButton) {
            lastActivatedButton.focus();
        }
    }

    let currentActiveShareTarget = null;

    /**
     * 동적 위치 계산 및 업데이트 (Desktop vs Mobile)
     */
    function updateSharePopupPosition() {
        var $popupShare = $('#md_share_area');
        if (!$popupShare.length || !$popupShare.hasClass('on') || !currentActiveShareTarget || !currentActiveShareTarget.length) {
            return;
        }

        var $box = $popupShare.find('.md_share_box');
        var isVer2 = $box.hasClass('ver2');
        var isMobile = window.innerWidth <= 1024;

        if (isMobile && isVer2) {
            // ver2 모바일 환경에서는 SCSS의 fixed 중앙 정렬 규칙 적용
            $popupShare.css({
                'position': '',
                'left': '',
                'top': '',
                'right': '',
                'z-index': ''
            });
        } else {
            // 데스크톱 환경에서는 버튼 좌표에 맞춰 위치 계산
            var $target = currentActiveShareTarget;
            var offsetPosition = $target.offset();
            var btnWidth = $target.outerWidth() || 0;
            var btnHeight = $target.outerHeight() || 0;
            var $box = $popupShare.find('.md_share_box');
            var popupWidth = $box.outerWidth() || 320;

            // 버튼 우측 아래에 맞춰 정렬 (우측 정렬)
            var x = offsetPosition.left + btnWidth - popupWidth;
            var y = offsetPosition.top + btnHeight + 8;

            // 화면 왼쪽 벗어남 방지
            if (x < 10) {
                x = 10;
            }

            // 화면 오른쪽 벗어남 방지
            var windowWidth = $(window).width();
            if (x + popupWidth > windowWidth - 10) {
                x = windowWidth - popupWidth - 10;
            }

            $popupShare.css({
                'position': 'absolute',
                'left': x + 'px',
                'top': y + 'px',
                'z-index': 999
            });
        }
    }

    /**
     * 공유하기 팝업 열기 (메인 통합 팝업 함수)
     */
    function md_pop_share(obj, e) {
        if (e && e.preventDefault) {
            e.preventDefault();
            e.stopPropagation();
        }
        var $target = $(obj);
        var $popupShare = $('#md_share_area');

        if (!$popupShare.length) {
            console.warn("[md_share] #md_share_area 요소를 찾을 수 없습니다.");
            return false;
        }

        if ($popupShare.parent()[0] !== document.body) {
            $('body').append($popupShare);
        }

        if ($target.hasClass('on') && $popupShare.hasClass('on') && !$popupShare.hasClass('off')) {
            mdShareClose();
            return false;
        }

        $popupShare.removeClass('off').addClass('on');
        $('.md_btn_share, .btn_md_share, .insight-report-detail__share-button--share').removeClass('on');
        $target.addClass('on');

        currentActiveShareTarget = $target;
        lastActivatedButton = $target;

        updateSharePopupPosition();
        focusTrapOn($popupShare);

        return false;
    }

    /**
     * 레거시 버전별 호환용 래퍼 함수들
     */
    function md_pop_share02(obj, e) {
        return md_pop_share(obj, e);
    }

    function md_pop_share03(obj, e) {
        return md_pop_share(obj, e);
    }

    function md_pop_share04(obj, e) {
        return md_pop_share(obj, e);
    }

    function open_sharebox(obj, url, artid, e) {
        if (url || artid) {
            $('.ico_share_box button').attr('data-url', url || '');
            $('.ico_share_box button').attr('data-artid', artid || '');
        }
        return md_pop_share(obj, e);
    }



    /**
     * 공유 팝업 닫기
     */
    function mdShareClose() {
        var lang = $("html").attr("lang") || "ko";
        var $shareArea = $('#md_share_area');
        if (!$shareArea.hasClass("on") || $shareArea.hasClass("off")) return;

        $shareArea.addClass('off');
        if (global.langSet && global.langSet[lang] && global.langSet[lang].share) {
            $(".md_btn_share").find(".blind").text(global.langSet[lang].share.shareOpen);
        }

        setTimeout(function () {
            $('.md_btn_share.on, .btn_md_share.on, .share_btn.on, .add_share.on, .post_share.on, .insight-report-detail__share-button--share.on').removeClass('on');
        }, 0);

        setTimeout(function () {
            $shareArea.removeClass('on').removeClass('off');
            $shareArea.css({ 'top': '', 'left': '', 'right': '', 'position': '' });
            currentActiveShareTarget = null;
        }, 250);

        focusTrapOff();
    }

    // 윈도우 리사이즈 및 스크롤 시 팝업 위치 동적 재계산
    $(window).on('resize.md_share scroll.md_share', function () {
        if ($('#md_share_area').hasClass('on')) {
            updateSharePopupPosition();
        }
    });

    /**
     * 공유 카운트 API 콜백 (옵션)
     */
    function setShareCnt(snsTypeId, shareArtId, shareTypeId) {
        if (!shareArtId) return;
        $.ajax({
            type: 'GET',
            url: '/app/setShareCnt?artId=' + shareArtId + '&typeId=' + (shareTypeId || '') + '&snsTypeId=' + snsTypeId,
            dataType: 'JSON',
            success: function (data) {
                // success handler
            },
            error: function () {
                // quiet failover
            }
        });
    }

    /**
     * 공유 버튼 이벤트 리스너 자동 바인딩
     */
    function initShareBtn() {
        $(document).on("click", ".md_btn_share, .btn_md_share, .insight-report-detail__share-button--share", function (e) {
            var onclickAttr = $(this).attr("onclick");
            // inline onclick이 이미 md_pop_share를 호출하는 경우 중복 호출 방지
            if (onclickAttr && onclickAttr.indexOf("md_pop_share") !== -1) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            md_pop_share04(this, e);
        });
    }

    // DOM Ready 핸들러
    $(function () {
        var lang = $("html").attr("lang") || "ko";
        var $shareBox = $(".md_share_box");
        var $shareDim = $(".md_share_dimd");
        var $shareCloseBtn = $(".md_btn_share_close");

        // 웹 접근성 속성 설정
        if (global.langSet && global.langSet[lang]) {
            $shareBox.find("button, a").not($shareCloseBtn).attr("title", global.langSet[lang].openWindow || "새창열림");
            $shareCloseBtn.find("span").text((global.langSet[lang].share && global.langSet[lang].share.shareClose) || "공유하기 닫기");
        }

        // 딤 클릭 시 닫기
        $shareDim.on("click", function () {
            mdShareClose();
            return false;
        });

        // 닫기 버튼 클릭 시 닫기
        $shareCloseBtn.on("click", function () {
            mdShareClose();
            return false;
        });

        // ESC 키 및 키보드 Tab Focus Trap
        $shareBox.on("keydown", function (e) {
            if (e.keyCode === 27) { // ESC Key
                mdShareClose();
                return;
            }

            var $shareBoxBtn = $shareBox.find('a:visible, button:visible');
            var $shareFirstBtn = $shareBoxBtn.first();
            var $shareLastBtn = $shareBoxBtn.last();

            if (e.keyCode === 9) { // Tab Key
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === $shareFirstBtn[0]) {
                        e.preventDefault();
                        $shareLastBtn.focus();
                    }
                } else { // Tab
                    if (document.activeElement === $shareLastBtn[0]) {
                        e.preventDefault();
                        $shareFirstBtn.focus();
                    }
                }
            }
        });

        // ----------------------------------------------------
        // SNS 공유 기능 구현
        // ----------------------------------------------------
        var $shareKakaotalk = $('#share_kakaotalk');
        var $shareFacebook = $('#share_facebook');
        var $shareTwitter = $('#share_twitter');
        var $shareLinkedin = $('#share_linkedin');
        var $shareInstagram = $('#share_instargram');
        var $shareNaver = $('#share_naver');
        var $shareLink = $('#share_link');

        function getTargetUrl($btn) {
            var url = $btn.attr('data-url');
            if (!url) {
                return location.href;
            }
            if (url.indexOf('http') === 0) {
                return url;
            }
            return location.origin + url;
        }

        // KakaoTalk
        $shareKakaotalk.on('click', function (e) {
            e.preventDefault();
            var artId = $(this).attr('data-artid') || $('#artId').val();
            var typeId = $('#typeId').val();
            setShareCnt('kt', artId, typeId);

            var url = getTargetUrl($(this));

            if (typeof global.Kakao !== 'undefined') {
                if (!global.Kakao.isInitialized()) {
                    global.Kakao.init('cbee93b45350bab6359a13c3ad1be5eb'); // Samsung SDS Kakao App Key
                }
                var shareArtData = (typeof global.bThumbList !== 'undefined')
                    ? global.bThumbList.find(function (item) { return item.id === artId; })
                    : null;

                global.Kakao.Link.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: shareArtData ? shareArtData.title : document.title,
                        description: '',
                        imageUrl: shareArtData ? shareArtData.thum_img : '',
                        link: { webUrl: url, mobileWebUrl: url }
                    },
                    buttons: [{ title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } }]
                });
            } else {
                window.open('https://story.kakao.com/share?url=' + encodeURIComponent(url), '_blank', 'width=800,height=600');
            }
        });

        // Facebook
        $shareFacebook.on('click', function (e) {
            e.preventDefault();
            var artId = $(this).attr('data-artid') || $('#artId').val();
            var typeId = $('#typeId').val();
            setShareCnt('fb', artId, typeId);
            var url = getTargetUrl($(this));
            window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "width=800,height=600");
        });

        // Twitter / X
        $shareTwitter.on('click', function (e) {
            e.preventDefault();
            var url = getTargetUrl($(this));
            window.open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(url), "_blank", "width=800,height=600");
        });

        // LinkedIn
        $shareLinkedin.on('click', function (e) {
            e.preventDefault();
            var artId = $(this).attr('data-artid') || $('#artId').val();
            var typeId = $('#typeId').val();
            setShareCnt('li', artId, typeId);
            var url = getTargetUrl($(this));
            window.open("https://www.linkedin.com/shareArticle/?mini=true&url=" + encodeURIComponent(url), "_blank", "width=800,height=600");
        });

        // Instagram
        $shareInstagram.on('click', function (e) {
            e.preventDefault();
            var artId = $(this).attr('data-artid') || $('#artId').val();
            var typeId = $('#typeId').val();
            setShareCnt('insta', artId, typeId);
            window.open("https://www.instagram.com", "_blank", "width=800,height=600");
        });

        // Naver Blog
        $shareNaver.on('click', function (e) {
            e.preventDefault();
            var artId = $(this).attr('data-artid') || $('#artId').val();
            var typeId = $('#typeId').val();
            setShareCnt('naver', artId, typeId);
            var url = getTargetUrl($(this));
            window.open("https://blog.naver.com/openapi/share?url=" + encodeURIComponent(url), "_blank", "width=500,height=600");
        });

        // Copy Link
        $shareLink.on('click', function (e) {
            e.preventDefault();
            var artId = $(this).attr('data-artid') || $('#artId').val();
            var typeId = $('#typeId').val();
            setShareCnt('url', artId, typeId);
            var url = getTargetUrl($(this));

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () {
                    alert("링크 주소가 복사되었습니다.");
                }).catch(function () {
                    prompt("해당 페이지의 링크 주소입니다. \"CTRL + C\"를 눌러 복사하세요.", url);
                });
            } else if (global.clipboardData) {
                global.clipboardData.setData("Text", url);
                alert("해당 페이지의 링크 주소입니다. \n \"CTRL + V\"를 눌러 붙여넣기 하세요.");
            } else {
                prompt("해당 페이지의 링크 주소입니다. \"CTRL + C\"를 눌러 복사하세요.", url);
            }
        });

        // 자동 초기화 실행
        initShareBtn();
    });

    // 게시글 인쇄 기능 (onclick="printPost();"로 사용 가능)
    var lastPrintTime = 0;

    function printPost() {
        var now = new Date().getTime();
        if (now - lastPrintTime < 500) return false;
        lastPrintTime = now;

        if (typeof window.beforePrint === 'function' && window.beforePrint !== beforePrint) {
            window.onbeforeprint = window.beforePrint;
        } else {
            window.onbeforeprint = beforePrint;
        }

        if (typeof window.afterPrint === 'function' && window.afterPrint !== afterPrint) {
            window.onafterprint = window.afterPrint;
        } else {
            window.onafterprint = afterPrint;
        }

        window.print();
        return false;
    }

    function beforePrint() {
        $(".post.is_reverse").css("display", "none");
        $(".float-section").css("display", "none");
        $(".post.is_flow").css("width", "100%").css("padding", "0 20px 0 20px");
        $(".backToList").css("display", "none");
        $(".postOtherInfo_viewAll").css("display", "none");
        $(".post_btnBox").css("display", "none");
        $(".insight-report-detail__side").css("display", "none");
        $(".insight-report-detail__share").css("display", "none");
    }

    function afterPrint() {
        $(".post.is_reverse").css("display", "");
        $(".float-section").css("display", "");
        $(".post.is_flow").css("width", "").css("padding", "");
        $(".backToList").css("display", "");
        $(".postOtherInfo_viewAll").css("display", "");
        $(".post_btnBox").css("display", "");
        $(".insight-report-detail__side").css("display", "");
        $(".insight-report-detail__share").css("display", "");
    }

    // 글로벌 네임스페이스 노출 (기존 코드 호환)
    global.md_pop_share = md_pop_share;
    global.md_pop_share02 = md_pop_share02;
    global.md_pop_share03 = md_pop_share03;
    global.md_pop_share04 = md_pop_share04;
    global.open_sharebox = open_sharebox;
    global.mdShareClose = mdShareClose;
    global.focusTrapOn = focusTrapOn;
    global.focusTrapOff = focusTrapOff;
    global.printPost = printPost;
    global.beforePrint = beforePrint;
    global.afterPrint = afterPrint;

})(typeof window !== 'undefined' ? window : this, typeof jQuery !== 'undefined' ? jQuery : null);
