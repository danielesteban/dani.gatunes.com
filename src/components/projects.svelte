<script lang="ts">
  import Projects from '../../projects/index.json';
</script>

<div class="projects">
  {#each Projects as project (project.id)}
    <div class="project">
      <div class="wrapper">
        <picture>
          <source srcset={`/projects/${project.id}.webp`} type="image/webp">
          <img src={`/projects/${project.id}.png`} alt={project.title}>
        </picture>
        <div class="flipper">
          <div class="info">
            <h2>{project.title}</h2>
            <div class="tags">
              {#each project.tags as tag}
                <div>
                  {tag}
                </div>
              {/each}
            </div>
            <p>{project.info}</p>
            <div class="url">
              https://{project.url}
            </div>
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <a
              href={`https://${project.url}`}
              rel="noopener noreferrer"
              target="_blank"
            ></a>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .projects {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    padding-top: 1rem;
  }
  .project {
    padding: 0 1rem 2rem;
    width: 100%;
    height: 460px;
  }
  .project, .wrapper {
    display: flex;
    justify-content: center;
  }
  .wrapper, .flipper, .info {
    width: 100%;
    height: 100%;
  }
  .wrapper {
    position: relative;
    background: #000;
    border: 2px solid #141414;
    box-shadow: 0 3px 10px rgba(0,0,0,.156863), 0 3px 10px rgba(0,0,0,.227451);
    overflow: hidden;
  }
  .wrapper > picture {
    height: 100%;
  }
  .flipper {
    position: absolute;
    top: 0;
    left: 0;
    perspective: 1000px;
  }
  .info {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    background: rgba(0, 0, 0, .75);
    color: #fff;
    padding: 1.5rem;
    transform: rotateX(-180deg);
    transform-origin: 0% 0%;
    transform-style: preserve-3d;
    transition: transform .25s ease-out;
    will-change: transform;
  }
  .info > a {
    display: block;
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .info > h2 {
    margin: 0 0 1rem;
  }
  .info > p {
    flex-grow: 1;
  }
  .tags {
    display: flex;
  }
  .tags > div {
    flex-grow: 1;
    padding: 0.125rem 0.25rem;
    background: rgba(50, 50, 50, .3);
    color: rgba(255, 255, 255, .6);
    border: 1px solid #000;
    margin-left: .25rem;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .tags > div:first-child {
    margin-left: 0;
  }
  .url {
    color: rgba(255, 255, 255, .5);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .wrapper:hover .info {
    transform: rotateY(0deg);
  }
  @media only screen and (min-width: 1024px) {
    .project {
      width: 50%;
    }
  }
  @media only screen and (min-width: 1408px) {
    .project {
      width: 33.333333333333336%;
    }
  }
  @media only screen and (min-width: 1920px) {
    .project {
      width: 25%;
    }
  }
</style>
