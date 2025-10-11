<template>
    <div class="app-layout">
        <!-- Navigation Header -->
        <nav class="nav-header">
            <div class="nav-brand">
                <NuxtLink to="/templates" class="brand-link">
                    <h1>flowy</h1>
                </NuxtLink>
            </div>
            
            <div class="nav-links">
                <NuxtLink to="/flows" class="nav-link">
                    Flows
                </NuxtLink>
                <NuxtLink to="/templates" class="nav-link">
                    Templates
                </NuxtLink>
                <NuxtLink to="/users" class="nav-link">
                    Users
                </NuxtLink>
                <NuxtLink to="/teams" class="nav-link">
                    Teams
                </NuxtLink>
            </div>
        </nav>
        
        <!-- Page Content -->
        <main class="main-content">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
// No reactive data needed in layout - moved to individual pages
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.nav-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand .brand-link {
  text-decoration: none;
  color: inherit;
}

.nav-brand h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.nav-icon {
  font-size: 1.1rem;
}

.main-content {
  padding: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }
  
  .nav-link {
    padding: 0.25rem 1rem;
    font-size: 0.875rem;
  }
}
</style>