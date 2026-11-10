"""Finalize the newly created personal artifact template for the approved repository workflow."""
import argparse
import json
from pathlib import Path
import shutil

source = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--skill-dir', required=True, type=Path)
args = parser.parse_args()
skill = args.skill_dir.resolve()
assert skill.name == 'artifact-template-surfside-proposal-workflow'
assert json.loads((skill/'artifact-template.json').read_text())['kind'] == 'site'
assert (skill/'assets/preview.png').is_file()
shutil.copy2(source/'SKILL.template.md', skill/'SKILL.md')
shutil.copy2(source/'openai.template.yaml', skill/'agents/openai.yaml')
retained = skill/'assets/source/_proposal-workflow'
shutil.copytree(source, retained, dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'tmp', '.openai'))
(skill/'assets/source/README.md').write_text('Surfside Proposal Workflow reference. The _proposal-workflow folder retains the approved parameterized PDF and webpage design and the complete generator. Use it with the existing surfsidepaint GitHub Pages repository. No customer data, Site identity, or cloud service is included.\n')
required = ['SKILL.md', 'artifact-template.json', 'agents/openai.yaml', 'assets/preview.png',
            'assets/source/_proposal-workflow/proposal.py',
            'assets/source/_proposal-workflow/template/site/index.html',
            'assets/source/_proposal-workflow/template/pdf/brand-header.png']
assert all((skill/name).is_file() for name in required)
for path in (skill/'assets/source').rglob('*'):
    assert path.name not in {'.git', '.gallery-data', '.wrangler', 'node_modules', '__pycache__'}
print('Personal template verified: '+str(skill))
