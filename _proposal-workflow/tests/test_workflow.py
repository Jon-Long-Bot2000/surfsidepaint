import importlib.util
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image
from pypdf import PdfReader

PACKAGE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('proposal_workflow', PACKAGE/'proposal.py')
workflow = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workflow)


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.repo = self.root/'repo'
        (self.repo/'.git').mkdir(parents=True)
        self.original_repo = workflow.repo_root
        workflow.repo_root = lambda: self.repo

    def tearDown(self):
        workflow.repo_root = self.original_repo
        self.temp.cleanup()

    def project(self, slug='test-project'):
        return workflow.create_project('123 Sample Lane, Ventura, CA', slug, self.root/'projects')

    def complete(self, project):
        data = workflow.read_json(project/'proposal-details.json')
        data.update({
            'prepared_for': {'company': 'Example & Sons <Builders>', 'contact': 'Example Contact',
                             'address': ['123 Sample Road', 'Ventura, CA'], 'phone': '555-0100', 'email': 'example@example.com'},
            'summary': 'Prepare and paint the property at '+data['site_address']+'.',
            'scope_paragraph': 'Protect adjacent finishes, prepare surfaces, prime repairs, and apply two finish coats.',
            'pricing': [{'title': 'Fixed price', 'description': 'Labor only.', 'amount': 1234.56}],
            'schedule': 'Five working days, weather permitting.', 'materials': 'Paint supplied by the contractor.',
            'pricing_confirmed': True, 'terms_confirmed': True, 'omitted_fields': ['web.hero_image'],
        })
        workflow.write_json(project/'proposal-details.json', data)
        return data

    def test_new_projects_have_no_customer_or_price_carryover_and_capture_template(self):
        a, b = self.project('first'), self.project('second')
        data = workflow.read_json(a/'proposal-details.json')
        self.assertEqual(data['prepared_for']['company'], '')
        self.assertIsNone(data['pricing'][0]['amount'])
        self.assertNotIn('substrate', data['terms'])
        self.assertNotIn('3%', json.dumps(data))
        self.assertNotEqual(data['project_id'], workflow.read_json(b/'proposal-details.json')['project_id'])
        self.assertTrue((a/'_template/proposal.py').is_file())
        self.assertTrue((a/'_template/template/pdf/brand-header.png').is_file())
        self.assertEqual(len(list((a/'assets').rglob('*.*'))), 0)

    def test_duplicate_and_unsafe_slugs_cannot_reuse_folders_or_site_routes(self):
        self.project('Existing')
        for slug in ['Existing', 'existing', '../outside', '/absolute', 'a/b', 'bad_slug']:
            with self.assertRaises(ValueError):
                self.project(slug)
        (self.repo/'Home').mkdir()
        with self.assertRaises(ValueError):
            self.project('home')

    def test_draft_build_is_real_pdf_but_cannot_be_published(self):
        project = self.project()
        site, report = workflow.build_project(project)
        text = ''.join(page.extract_text() for page in PdfReader(site/'test-project_Surfside_Proposal.pdf').pages)
        self.assertIn('DRAFT - Not approved for submission', text)
        self.assertIn('Draft proposal', (site/'index.html').read_text())
        self.assertTrue(list((project/'output/pdf-pages').glob('*.png')))
        with self.assertRaises(ValueError):
            workflow.stage_project(project, self.repo)
        with self.assertRaises(ValueError):
            workflow.build_project(project, final=True)

    def test_final_build_escapes_user_text_and_stages_only_public_files(self):
        project = self.project()
        data = self.complete(project)
        data['project_name'] = '<script>alert("x")</script> & Sample'
        data['web']['hero_image'] = 'assets/hero.png'
        data['web']['hero_caption'] = '<img src=x onerror=bad> & caption'
        workflow.write_json(project/'proposal-details.json', data)
        for path in ['assets/hero.png', 'assets/before/source.png', 'assets/after/source.png']:
            Image.new('RGB', (320, 240), '#b2c9b4').save(project/path)
        site, report = workflow.build_project(project, final=True)
        html = (site/'index.html').read_text()
        self.assertIn('&lt;script&gt;', html)
        self.assertNotIn('<script>alert', html)
        self.assertEqual((report['before_photos'], report['after_photos']), (1, 1))
        self.assertIn('aria-label="Open proposal PDF"', html)
        self.assertNotIn('type="file"', html)
        self.assertNotIn('fetch(', (site/'gallery.mjs').read_text())
        text = ''.join(page.extract_text() for page in PdfReader(site/'test-project_Surfside_Proposal.pdf').pages)
        self.assertIn('$1,234.56', text)
        self.assertIn('Five working days', text)
        self.assertNotIn('Divine', text)
        target = workflow.stage_project(project, self.repo)
        self.assertEqual(workflow.content_hashes(site), workflow.content_hashes(target))
        self.assertFalse((target/'proposal-details.json').exists())
        self.assertFalse((target/'assets').exists())
        self.assertFalse((target/'backend').exists())

    def test_stale_and_modified_builds_are_blocked(self):
        project = self.project()
        self.complete(project)
        site, _ = workflow.build_project(project, final=True)
        original = (project/'proposal-details.json').read_text()
        data = json.loads(original)
        data['scope_paragraph'] += ' Extra work.'
        workflow.write_json(project/'proposal-details.json', data)
        with self.assertRaisesRegex(ValueError, 'changed'):
            workflow.stage_project(project, self.repo)
        (project/'proposal-details.json').write_text(original)
        (site/'index.html').write_text('<p>tampered</p>')
        with self.assertRaisesRegex(ValueError, 'changed'):
            workflow.stage_project(project, self.repo)

    def test_existing_routes_and_other_proposals_are_never_overwritten(self):
        a, b = self.project('alpha'), self.project('beta')
        self.complete(a); self.complete(b)
        workflow.build_project(a, final=True)
        workflow.build_project(b, final=True)
        first = workflow.stage_project(a, self.repo)
        old = workflow.content_hashes(first)
        workflow.stage_project(b, self.repo)
        self.assertEqual(old, workflow.content_hashes(first))
        workflow.stage_project(a, self.repo)  # same project may be revised
        marker = workflow.read_json(first/'proposal-project.json')
        marker['project_id'] = '0'*32
        workflow.write_json(first/'proposal-project.json', marker)
        with self.assertRaisesRegex(ValueError, 'another project'):
            workflow.stage_project(a, self.repo)

    def test_escape_paths_invalid_prices_and_omitted_approvals_fail_closed(self):
        project = self.project()
        data = self.complete(project)
        for bad in [-1, float('nan'), True, '15000']:
            data['pricing'][0]['amount'] = bad
            workflow.write_json(project/'proposal-details.json', data)
            with self.assertRaises(ValueError):
                workflow.build_project(project, final=True)
        data['pricing'][0]['amount'] = 0
        data['omitted_fields'] = ['terms_confirmed', 'web.hero_image']
        workflow.write_json(project/'proposal-details.json', data)
        with self.assertRaisesRegex(ValueError, 'approval flags'):
            workflow.build_project(project, final=True)
        outside = self.root/'outside.png'
        Image.new('RGB', (10, 10)).save(outside)
        with self.assertRaises(ValueError):
            workflow.within(project, '../outside.png')
        with self.assertRaises(ValueError):
            workflow.within(project, str(outside))

    def test_install_and_restore_keep_existing_guidance_and_files(self):
        spec = importlib.util.spec_from_file_location('proposal_installer', PACKAGE/'install.py')
        installer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(installer)
        (self.repo/'AGENTS.md').write_text('Existing unrelated project guidance.\n')
        (self.repo/'.gitignore').write_text('/other-private-files/\n')
        with contextlib.redirect_stdout(io.StringIO()):
            installer.install(self.repo)
            installer.install(self.repo)
        guidance = (self.repo/'AGENTS.md').read_text()
        self.assertIn('Existing unrelated project guidance.', guidance)
        self.assertEqual(guidance.count(installer.START), 1)
        self.assertEqual((self.repo/'.gitignore').read_text().count('/_proposal-projects/'), 1)
        self.assertIn('/other-private-files/', (self.repo/'.gitignore').read_text())
        target = self.repo/'_proposal-workflow'
        (target/'defaults.json').write_text('preserve local customization')
        (target/'INTAKE.md').unlink()
        with contextlib.redirect_stdout(io.StringIO()):
            installer.install(self.repo, restore_missing=True)
        self.assertEqual((target/'defaults.json').read_text(), 'preserve local customization')
        self.assertTrue((target/'INTAKE.md').is_file())


if __name__ == '__main__':
    unittest.main()
