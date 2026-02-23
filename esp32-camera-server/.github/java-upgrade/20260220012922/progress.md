# Upgrade Progress

  ### ✅ Generate Upgrade Plan
  - [[View Log]](logs/1.generatePlan.log)

  ### ✅ Confirm Upgrade Plan
  - [[View Log]](logs/2.confirmPlan.log)

  ### ✅ Setup Development Environment
  - [[View Log]](logs/3.setupEnvironment.log)
  
  > There are uncommitted changes in the project before upgrading, which have been stashed according to user setting "appModernization.uncommittedChangesAction".

  ### ✅ PreCheck
  - [[View Log]](logs/4.precheck.log)
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Precheck - Build project
    - [[View Log]](logs/4.1.precheck-buildProject.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  
    ### ✅ Precheck - Validate CVEs
    - [[View Log]](logs/4.2.precheck-validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### CVE issues
    </details>
  
    ### ✅ Precheck - Run tests
    - [[View Log]](logs/4.3.precheck-runTests.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Test result
    | Total | Passed | Failed | Skipped | Errors |
    |-------|--------|--------|---------|--------|
    | 0 | 0 | 0 | 0 | 0 |
    </details>
  </details>

  ### ✅ Upgrade project to use `Java 21`
  
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Upgrade using Agent
    - [[View Log]](logs/5.1.upgradeProjectUsingAgent.log)
    
    - 3 files changed, 68 insertions(+), 14 deletions(-)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Code changes
    - Upgrade Java runtime from 17 to 21
      - Updated `java.version`, `maven.compiler.source`, `maven.compiler.target` properties to 21 in pom.xml
      - Applied OpenRewrite `org.openrewrite.java.migrate.UpgradeToJava21` recipe to update source code for Java 21 compatibility
    </details>
  
    ### ✅ Build Project
    - [[View Log]](logs/5.2.buildProject.log)
    
    - Build result: 100% Java files compiled
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  </details>

  ### ✅ Validate & Fix
  
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Validate CVEs
    - [[View Log]](logs/6.1.validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Checked Dependencies
      - java:*:21
    </details>
  
    ### ✅ Validate Code Behavior Changes
    - [[View Log]](logs/6.2.validateBehaviorChanges.log)
  
    ### ✅ Run Tests
    - [[View Log]](logs/6.3.runTests.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Test result
    | Total | Passed | Failed | Skipped | Errors |
    |-------|--------|--------|---------|--------|
    | 0 | 0 | 0 | 0 | 0 |
    </details>
  </details>

  ### ✅ Summarize Upgrade
  - [[View Log]](logs/7.summarizeUpgrade.log)