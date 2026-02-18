# Automatic Version Management

## Overview

이 프로젝트는 Git commit-msg hook을 사용하여 **커밋 메시지 타입에 따라 자동으로 버전을 업데이트**합니다.

### How It Works

1. 커밋 메시지의 prefix를 분석 (`feat:`, `fix:`, `BREAKING CHANGE:` 등)
2. 현재 버전을 파싱 (pom.xml 기준)
3. Semantic Versioning 규칙에 따라 버전 계산
4. 6개 파일에 새 버전 자동 업데이트:
   - `esp32-camera-server/pom.xml`
   - `esp32-camera-server/package.json`
   - `esp32-camera-server/Dockerfile`
   - `esp32-camera-server/src/main/java/io/granule/camera/server/config/ServerConfig.java`
   - `esp32-camera-client/config.js`
   - `VERSION.md` (Current Versions + Version History)
5. 변경된 파일들을 자동으로 staging

## Version Bump Rules

| Commit Type | Version Change | Example |
|------------|----------------|---------|
| `BREAKING CHANGE:` | MAJOR +1 | 1.1.1 → 2.0.0 |
| `feat:` | MINOR +1 | 1.1.1 → 1.2.0 |
| `fix:` | PATCH +1 | 1.1.1 → 1.1.2 |
| `perf:` | PATCH +1 | 1.1.1 → 1.1.2 |
| `refactor:` | PATCH +1 | 1.1.1 → 1.1.2 |
| `revert:` | PATCH +1 | 1.1.1 → 1.1.2 |
| `docs:`, `style:`, `test:`, `chore:` | No change | 1.1.1 → 1.1.1 |

## Usage Examples

### 새로운 기능 추가 (MINOR bump)

```bash
git add .
git commit -m "feat: add camera zoom control"
```

**출력:**
```
🔄 Auto-versioning detected:
   Type: feat
   Current: 1.1.1
   New: 1.2.0

✅ Version bumped to 1.2.0 and files staged
```

### 버그 수정 (PATCH bump)

```bash
git add .
git commit -m "fix: resolve WebSocket reconnection issue"
```

**출력:**
```
🔄 Auto-versioning detected:
   Type: fix
   Current: 1.2.0
   New: 1.2.1

✅ Version bumped to 1.2.1 and files staged
```

### Breaking Change (MAJOR bump)

```bash
git add .
git commit -m "feat: redesign WebSocket protocol

BREAKING CHANGE: client must upgrade to new protocol"
```

**출력:**
```
🔄 Auto-versioning detected:
   Type: BREAKING CHANGE
   Current: 1.2.1
   New: 2.0.0

✅ Version bumped to 2.0.0 and files staged
```

### 문서 업데이트 (버전 변경 없음)

```bash
git add README.md
git commit -m "docs: update installation guide"
```

**출력:**
```
(버전 관련 메시지 없음 - hook이 docs: 타입은 무시)
```

## Installation Verification

Hook이 제대로 설치되었는지 확인:

```bash
ls -l .git/hooks/commit-msg
```

**예상 결과:** `-rwxr-xr-x` (실행 권한 있음)

## Manual Version Update (Override)

자동 버전 업데이트를 일시적으로 비활성화하려면:

```bash
git commit --no-verify -m "your message"
```

## Troubleshooting

### Hook이 실행되지 않는 경우

1. Hook 파일 권한 확인:
   ```bash
   chmod +x .git/hooks/commit-msg
   ```

2. Hook 파일 존재 확인:
   ```bash
   cat .git/hooks/commit-msg
   ```

### 잘못된 버전이 적용된 경우

1. 마지막 커밋 취소:
   ```bash
   git reset --soft HEAD~1
   ```

2. 수동으로 버전 수정 (6개 파일 모두):
   - pom.xml
   - package.json
   - Dockerfile
   - ServerConfig.java
   - config.js
   - VERSION.md

3. 다시 커밋:
   ```bash
   git add .
   git commit -m "fix: correct version to X.Y.Z"
   ```

## Team Setup

팀원들이 hook을 설치하도록 하려면:

### 방법 1: Hook 파일 공유 (.githooks 디렉토리 사용)

```bash
# 프로젝트 루트에 .githooks 디렉토리 생성
mkdir -p .githooks
cp .git/hooks/commit-msg .githooks/

# 팀원들은 clone 후 실행:
cp .githooks/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
```

### 방법 2: 설치 스크립트 제공

`install-hooks.sh` 파일 생성:

```bash
#!/bin/bash
cp .githooks/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
echo "✅ Auto-versioning hook installed"
```

팀원들은:
```bash
./install-hooks.sh
```

## Platform Notes

- **macOS**: Hook은 BSD sed를 사용 (`sed -i ''`)
- **Linux**: GNU sed 사용 (`sed -i`)
- 현재 hook은 macOS/Linux 모두 호환되도록 작성됨
- VERSION.md 업데이트는 awk를 사용하여 개행 문제 해결

## Related Documentation

- [VERSION.md](./VERSION.md) - Version history and update checklist
- [Semantic Versioning](https://semver.org/) - Versioning specification
