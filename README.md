# 푸른 수염 스튜디오 (Blue Hige Studio)

게임을 중심으로 앱·360° 이미지·Blender·AI 제작 도구를 소개하는 GitHub Pages 홈페이지입니다.

- **홈페이지:** https://bluehige.github.io/
- **작품 데이터:** [projects.js](projects.js)
- **메인 화면:** [index.html](index.html)
- **상세 화면:** [project.html](project.html)
- **디자인:** [styles.css](styles.css)
- **브랜드 이미지:** [assets/blue-hige.svg](assets/blue-hige.svg), [assets/brand-mark.svg](assets/brand-mark.svg)

## 작품 관리

\`projects.js\`의 \`BH_PROJECTS\` 배열에 항목을 추가하거나 수정합니다. 각 프로젝트는 ID, 이름, 카테고리(\`game/app/tool/lab\`), 상태, 소개, 핵심 기능, 링크를 갖습니다. 실제 스토어 URL은 확인 후 \`links\`에 추가하세요. 대형 프로젝트의 웹 테스트 저장소는 정식 프로젝트 카드와 중복 등록하지 않고, 관련 페이지의 보조 링크로 활용합니다.

\`index.html\`은 메인 홈페이지, \`project.html?id=<프로젝트ID>\`는 동일한 프로젝트 데이터로 내용을 표시하는 상세 페이지입니다. 새로운 세부 페이지 HTML을 만들 필요가 없습니다.

## 공개·제외 기준

- 공개 작품/도구를 우선 소개하며, 다른 개발자의 제품을 자체 개발작으로 표기하지 않습니다.
- 빈 테스트 저장소, 마왕성 중복 웹 배포 저장소, 미출시 원고, 외부 프로젝트 사본은 전면 소개에서 제외합니다.
- 이미지 저작권 및 공개 가능성이 불명확한 퍼즐 리소스는 전면 노출하지 않습니다.
- 사주MBTI는 출시 준비/개발 중 상태로, 360° 이미지 제작 도구는 별도 서버 환경이 필요한 개발 프로젝트로 표시합니다.
- 기존 \`mbti-persona/\` 디렉터리, \`.nojekyll\`, \`app-ads.txt\` 파일은 유지합니다.

## 테스트

정적 페이지이므로 로컬 서버에서 테스트할 수 있습니다.

\`\`\`sh
python -m http.server 8000
\`\`\`

http://localhost:8000/ 와 http://localhost:8000/project.html?id=mawang 를 열어 확인합니다. 외부 이미지와 Google Fonts는 인터넷 연결이 필요합니다.
