/**
 * 멜리언스 여행용 멀티 어댑터 랜딩페이지 스크립트
 * 요구사항: 
 * - CTA 버튼 클릭 시 '아직 준비 중입니다.' 모달 안내
 * - 상품 사진 누락 시 '이미지 준비 중' 처리
 * - FAQ 아코디언 인터랙션 및 접근성 지원
 */

document.addEventListener('DOMContentLoaded', () => {
    initCtaButtons();
    initFaqAccordion();
    initModalEvents();
});

/**
 * 1. CTA 버튼 이벤트 초기화
 * - 첫 화면(#cta-hero), 최하단(#cta-final-btn), 헤더(#cta-mini) 등 구분
 */
function initCtaButtons() {
    const ctaButtons = document.querySelectorAll('[data-cta-location]');

    ctaButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const location = button.getAttribute('data-cta-location');
            console.log(`[CTA Clicked] Location: ${location}, ID: ${button.id}`);
            
            // 실제 외부 링크(쿠팡 파트너스 등)가 설정된 경우 자연스러운 새 탭 이동 허용
            if (button.tagName === 'A' && button.hasAttribute('href') && button.getAttribute('href') !== '#') {
                return;
            }

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
