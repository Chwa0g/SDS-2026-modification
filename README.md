# SDS Renewal Project

정적 페이지 기반의 SDS 리뉴얼 작업용 폴더

## 폴더 구조

- [app/html](app/html): HTML 템플릿
- [app/inc](app/inc): 공통 include 파일
- [app/static/css](app/static/css): 컴파일된 CSS
- [app/static/scss](app/static/scss): SCSS 소스
- [app/static/js](app/static/js): JavaScript 파일
- [app/static/images](app/static/images): 이미지 리소스
- [app/static/fonts](app/static/fonts): 웹 폰트
- [dist](dist): 빌드 결과물

## 개발 환경

- Node.js
- npm 또는 yarn
- Gulp

## 설치

```bash
npm install
```

또는

```bash
yarn install
```

## 개발 실행

```bash
npm run dev
```

또는

```bash
yarn dev
```

실행하면 BrowserSync가 시작되고 기본 진입 페이지는 [app/html/dashboard.html](app/html/dashboard.html)로 열린다.

## 빌드

```bash
npm run build
```

또는

```bash
yarn build
```

빌드 결과는 [dist](dist) 폴더로 생성된다.

## Main Features

- SCSS compilation
- HTML include processing
- JS copying
- Image and font copying
- Development server startup



## 확인 필요사항

### 메인
- 탭 이동이 순차적으로 적용되어야함 > 우선순위 낮음
- 하단 play / stop > swiper 에서 찾아서 넣기
> 디자인 수정 필요
- 메일로 전달받은 css 는 전반적으로 적용 후 테스트 필요 > 우선순위 높음
- 메인 삼성SDS만의 AI기술과 서비스
> loop 로 진행

### 오퍼링
- 오퍼링
유지할 수 있는 부분은 유지..?
오퍼링 의 경우 vw 지양하고 필요시 @media 사용
offering-main 클래스는 container 에서 추가

### 인사이트
- report
thumbnail 사이즈 전달 필요 > 우선순위 높음

### 공통
carousel 디자인 확인
카운팅 방식 확인
변경 내용은 날짜 주석으로 표기해서 전달
접근성 관련해서 추가로 수정이 필요할 경우 따로 일정 전달

CSS분리
- header / footer 공통 컨텐츠
- 카테고리 별 CSS

css 충돌확인
버튼의 class명이 동일해서 asis에 영향을 주고 받고 있음