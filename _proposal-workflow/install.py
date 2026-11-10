"""Install this local workflow into an existing Surfside checkout; never commits or publishes."""
import argparse
from pathlib import Path
import shutil

SOURCE = Path(__file__).resolve().parent
START = '<!-- surfside-proposal-workflow:start -->'
END = '<!-- surfside-proposal-workflow:end -->'
GUIDANCE = '''## Surfside proposal requests

When the user asks to create a proposal for an address, use the approved Surfside
proposal workflow. Read `_proposal-workflow/WORKFLOW.md` and `INTAKE.md`. This
applies in new chats without needing the old Poli conversation.

The user's saved workflow starts from current `origin/main`, creates a distinct
`codex/proposal-<slug>` branch and `_proposal-projects/<slug>` local source folder,
asks only for missing details, generates a PDF and static webpage, and provides
desktop and mobile preview URLs. Obtain approval for the concrete final proposal
before publishing that project to its own URL. Keep branches unless asked to
retire them. Never include unrelated local changes, especially `homes/index.html`.

Every project retains its own `_template/` snapshot. Use that snapshot for
revisions. Do not reuse a different customer's details, prices, terms or images.
Photo uploads and Cloudflare R2 are disabled. Publish only generated static files.

If `_proposal-workflow` is absent after switching to a branch based on main,
restore the toolkit from the personal Surfside Proposal Workflow template at
`~/.codex/skills/artifact-template-surfside-proposal-workflow/assets/source/_proposal-workflow`
using its `install.py --repo REPO --restore-missing` command. Do not replace
existing toolkit files without checking their version. The personal template is
the durable backup while this workflow branch awaits incorporation into main.
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
