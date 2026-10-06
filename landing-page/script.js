/**
 * 멜리언스 여행용 멀티 어댑터 랜딩페이지 스크립트
 * 요구사항: 
 * - CTA 버튼 클릭 시 '아직 준비 중입니다.' 모달 안내
 * - 상품 사진 누락 시 '이미지 준비 중' 처리
 * - FAQ 아코디언 인터랙션 및 접근성 지원
 */

document.addEventListener('DOMContentLoaded', () => {
    initGa4Tracking();
    initFaqAccordion();
    initModalEvents();
});

/**
 * GA4 이벤트 안전 전송 헬퍼 함수
 * - GA 차단/미로드 시에도 예외 없이 안전하게 무시
 * - PII 미수집, debug_mode 강제 활성화 없음
 */
function sendGaEvent(eventName, params) {
    try {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
    } catch (err) {
        console.warn(`[GA4] 이벤트 전송 예외 안전 처리 (${eventName}):`, err);
    }
}

/**
 * GA4 측정 초기화 (중복 실행 방지 가드 포함)
 */
function initGa4Tracking() {
    if (window.__ga4_tracking_initialized) {
        return;
    }
    window.__ga4_tracking_initialized = true;

    initSectionViewTracking();
    initCtaButtons();
}

/**
 * 1. 구간 도달(section_view) 측정
 * - #hero-title → hero
 * - #detail-space-title → detail
 * - #purchase-title → cta
 * - 제목 면적 50% 이상 노출 시 1회만 전송
 * - 고정 헤더 가림 높이(64px) 제외
 * - 문서 활성(visibilityState === 'visible') 시에만 전송
 * - 탭 복귀 시 화면에 보이는 제목 누락 방지
 */
function initSectionViewTracking() {
    const sectionTargets = [
        { id: 'hero-title', name: 'hero' },
        { id: 'detail-space-title', name: 'detail' },
        { id: 'purchase-title', name: 'cta' }
    ];

    const viewedSections = new Set();
    const targetMap = new Map(); // element -> section_name

    const headerEl = document.querySelector('header') || document.getElementById('header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 64;

    const observerOptions = {
        root: null,
        rootMargin: `-${headerHeight}px 0px 0px 0px`, // 고정 헤더 영역 제외
        threshold: 0.5                               // 제목 면적 50% 이상
    };

    function triggerSectionView(element, sectionName) {
        if (viewedSections.has(sectionName)) return;
        viewedSections.add(sectionName);

        sendGaEvent('section_view', {
            section_name: sectionName
        });
        console.log(`[GA4] section_view 전송: section_name=${sectionName}`);

        if (observer && element) {
            observer.unobserve(element);
        }
    }

    let observer = null;
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionName = targetMap.get(entry.target);
                if (!sectionName || viewedSections.has(sectionName)) return;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    if (document.visibilityState === 'visible') {
                        triggerSectionView(entry.target, sectionName);
                    }
                }
            });
        }, observerOptions);
    }

    // 관찰 대상 제목 요소 등록
    sectionTargets.forEach(({ id, name }) => {
        const el = document.getElementById(id);
        if (el) {
            targetMap.set(el, name);
            if (observer) {
                observer.observe(el);
            }
        }
    });

    // 탭 복귀(visibilitychange) 시 현재 뷰포트에 50% 이상 보이는 제목 감지
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;

        targetMap.forEach((name, el) => {
            if (viewedSections.has(name)) return;

            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            const visibleTop = Math.max(rect.top, headerHeight);
            const visibleBottom = Math.min(rect.bottom, viewportHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);

            if (rect.height > 0 && (visibleHeight / rect.height) >= 0.5) {
                triggerSectionView(el, name);
            }
        });
    });
}

/**
 * 2. CTA 버튼 이벤트 및 클릭(cta_click) 측정 초기화
 * - #cta-hero / [data-cta-location="hero"] → hero
 * - #cta-final / #cta-final-btn / [data-cta-location="final"] → final
 * - 중복 리스너 등록 방지 (Map 고유 요소 매핑)
 * - 일반 클릭 및 키보드 Enter 활성화 시 1회 전송
 * - 재클릭 시 매번 전송
 * - 기본 링크 이동(새 탭) 방해/지연 없음
 */
function initCtaButtons() {
    const ctaMap = new Map();

    const heroBtn = document.querySelector('#cta-hero, [data-cta-location="hero"]');
    if (heroBtn) {
        ctaMap.set(heroBtn, 'hero');
    }

    const finalBtn = document.querySelector('#cta-final, #cta-final-btn, [data-cta-location="final"]');
    if (finalBtn) {
        ctaMap.set(finalBtn, 'final');
    }

    // 헤더 미니 CTA 등 기타 CTA 요소 등록
    const otherCtas = document.querySelectorAll('[data-cta-location]:not(#cta-hero):not(#cta-final):not(#cta-final-btn)');
    otherCtas.forEach(btn => {
        if (!ctaMap.has(btn)) {
            ctaMap.set(btn, btn.getAttribute('data-cta-location') || 'other');
        }
    });

    ctaMap.forEach((location, element) => {
        element.addEventListener('click', (event) => {
            // hero 또는 final CTA일 때 GA4 cta_click 이벤트 전송
            if (location === 'hero' || location === 'final') {
                sendGaEvent('cta_click', {
                    button_location: location
                });
                console.log(`[GA4] cta_click 전송: button_location=${location}`);
            }

            // 실제 외부 링크(쿠팡 파트너스 등)가 설정된 경우 자연스러운 새 탭 이동 허용 (지연/차단 없음)
            if (element.tagName === 'A' && element.hasAttribute('href') && element.getAttribute('href') !== '#') {
                return;
            }

            // 미연결 버튼(모달 안내 대상)인 경우에만 기본 동작 방지 및 모달 노출
            event.preventDefault();
            openCtaModal();
        });
    });
}

/**
 * 2. FAQ 아코디언 초기화
 */
function initFaqAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const content = item.querySelector('.accordion-content');
            const isCurrentlyExpanded = header.getAttribute('aria-expanded') === 'true';

            // 상태 토글 (대화형 버튼 요소에만 aria-expanded 유지)
            const nextState = !isCurrentlyExpanded;
            header.setAttribute('aria-expanded', String(nextState));

            if (nextState) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });

        // 키보드 웹 접근성 (Enter / Space)
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click();
            }
        });
    });
}

/**
 * 3. CTA 모달 열기/닫기 제어
 */
function openCtaModal() {
    const modal = document.getElementById('cta-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // 닫기 버튼에 초점 이동 (접근성)
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.focus();
}

function closeCtaModal() {
    const modal = document.getElementById('cta-modal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function initModalEvents() {
    const modal = document.getElementById('cta-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeCtaModal);
    }

    // 모달 배경 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCtaModal();
            }
        });
    }

    // ESC 키로 닫기
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCtaModal();
        }
    });
}

/**
 * 4. 이미지 로드 실패 시 '이미지 준비 중' 대체 핸들러
 */
function handleImageFallback(imgElement) {
    if (!imgElement) return;
    
    imgElement.style.display = 'none';
    const parentCrop = imgElement.closest('.image-crop');
    if (parentCrop) {
        parentCrop.classList.add('is-fallback');
    }
}
