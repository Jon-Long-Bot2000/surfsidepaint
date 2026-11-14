"""Install this local workflow into an existing Surfside checkout; never commits or publishes."""
import argparse
from pathlib import Path
import shutil

SOURCE = Path(__file__).resolve().parent
START = '<!-- surfside-proposal-workflow:start -->'
END = '<!-- surfside-proposal-workflow:end -->'
GUIDANCE = '''## Surfside proposal requests

For "Create a proposal for [address]", read `_proposal-workflow/WORKFLOW.md` and
`INTAKE.md`. The approved local version is 2.0.0: four-step visual editor and
interactive proposal site, with primary hero photos/thumbnails and NO Photo Gallery.

Before creating any new project folder, files or branch, show the address,
`_proposal-projects/<street-slug>/`, `codex/proposal-<street-slug>` and eventual
`https://www.surfsidepaint.com/<street-slug>/` URL; obtain explicit creation approval.
Then branch from current origin/main, preserving unrelated edits, and create a
blank project with its own `_template/` snapshot. Start the matching snapshot's
`proposal.py editor PROJECT --port AVAILABLE_PORT` for intake and live preview.
Use each existing project's own snapshot for revisions; do not migrate old jobs.

The editor and website lookup are local-only. Uploaded hero photos and contractor
logos are local editor inputs; visitor uploads, Cloudflare R2 and gallery features
are disabled. Only generated static proposal bundles may be published after
separate approval of the concrete final result. Keep branches unless asked to
retire them. Never include unrelated changes, especially `homes/index.html`.

The user authorized releasing the v2 toolkit to the existing repository. Preserve
subsequent local changes and this guidance across branch switches. The personal skill's retained backup
also contains v2.0.0. If the toolkit is missing, restore it using the personal
backup's assets/source/_proposal-workflow/install.py --repo REPO --restore-missing.
Review versions and preserve modifications before replacing any toolkit.
Do not run tests, checks or builds during design iteration unless authorized.
New customer proposals still require explicit creation and publication approval.
'''


def managed_block(path, content):
    old = path.read_text() if path.exists() else ''
    block = START+'\n'+content.strip()+'\n'+END
    if START in old:
        if END not in old:
            raise ValueError('Incomplete managed instruction block: '+str(path))
        before, rest = old.split(START, 1)
        _, after = rest.split(END, 1)
        new = before+block+after
    else:
        new = old.rstrip()+'\n\n'+block+'\n' if old.strip() else block+'\n'
    path.write_text(new)


def install(repo, restore_missing=False):
    repo = repo.resolve()
    if not (repo/'.git').exists():
        raise ValueError('Choose the existing surfsidepaint repository root.')
    target = repo/'_proposal-workflow'
    if target.is_symlink():
        raise ValueError('Refusing to install through a symbolic link.')
    if target.exists() and restore_missing:
        if (target/'VERSION').read_text() != (SOURCE/'VERSION').read_text():
            raise ValueError('Existing toolkit version differs; review it before replacing anything.')
        for source in SOURCE.rglob('*'):
            if source.is_file() and '__pycache__' not in source.parts and 'tmp' not in source.relative_to(SOURCE).parts:
                destination = target/source.relative_to(SOURCE)
                if not destination.exists():
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source, destination)
    elif target != SOURCE:
        shutil.copytree(SOURCE, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'tmp', '.openai'))
    managed_block(repo/'AGENTS.md', GUIDANCE)
    ignore = repo/'.gitignore'
    old = ignore.read_text() if ignore.exists() else ''
    if '/_proposal-projects/' not in old.splitlines():
        ignore.write_text(old.rstrip()+'\n/_proposal-projects/\n' if old else '/_proposal-projects/\n')
    projects = repo/'_proposal-projects'
    projects.mkdir(exist_ok=True)
    print('Installed toolkit: '+str(target))
    print('Project inputs stay local: '+str(projects))
    print('No Git commit, push, cloud resource or live-site change performed.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--restore-missing', action='store_true')
    arguments = parser.parse_args()
    install(arguments.repo, arguments.restore_missing)
