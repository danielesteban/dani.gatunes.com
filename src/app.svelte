<script>
  import Background from './components/background.svelte';
  import Favicon from './components/favicon.svelte';
  import Info from './components/info.svelte';
  import Project from './components/project.svelte';
  import Sponsor from './components/sponsor.svelte';
  import projects from '../projects/index.json';
</script>

<Background />
<Favicon />
<Sponsor />

<div class="projects">
  {#each projects as project (project.id)}
    <Project data={project} />
  {/each}
</div>

<Info />

<style>
  .projects {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    padding-top: 1rem;
  }
</style>
