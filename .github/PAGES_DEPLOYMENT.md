# luastra.dev deployment contract

The canonical website source is the Luastra application in `website/app`.
`website/luastra-site` is generated output and is never committed. The
`Publish luastra.dev` workflow builds and verifies that application from the
exact tag attached to a published GitHub Release, uploads the generated static
bundle as a GitHub Pages artifact, and deploys that artifact.

## Publication boundary

- Ordinary pushes and pull requests never deploy the website.
- Draft releases never deploy the website.
- The deployment workflow runs only when a release in `Luastra/luastra` is
  published and its tag begins with `v`.
- Publishing a tagged release, enabling Pages, and changing DNS are explicit
  maintainer-controlled release actions; ordinary CI cannot perform them.
- The `github-pages` environment records the production deployment and must
  retain branch and reviewer protections admitted by the repository settings.

## GitHub Pages settings

For the first production deployment:

1. set the Pages source to **GitHub Actions**;
2. configure the custom domain as `luastra.dev`;
3. verify the domain for the `Luastra` organization before announcing it;
4. publish only the already reviewed release and allow its workflow to deploy;
5. wait for GitHub's DNS and certificate checks to pass;
6. enable **Enforce HTTPS**;
7. verify `https://luastra.dev` and representative deep links anonymously.

For an apex domain, use the current GitHub Pages DNS records documented by
GitHub at publication time. If `www.luastra.dev` is retained, point its CNAME
to `Luastra.github.io` and verify that it redirects to the canonical apex
domain. Do not add a `CNAME` file to the generated artifact: custom GitHub
Actions publishing uses the Pages repository setting as the domain source.

## Verification and rollback

The deployment must report the exact release tag and commit it checked out.
The generated site must pass the SDK-reference validator, application tests,
clean-candidate audit, responsive browser checks, link checks, and HTTPS smoke
checks. If the first deployment is not correct, unpublish the Pages deployment
without changing or deleting the preserved private-history repository. Bytes
already made public must be treated as disclosed even after unpublishing.
